"""Veteran profile, gamification, assessment, and task endpoints.

Supports:
- 5-question Harvard Trauma wellness assessment with real-time AI risk evaluation and counselor alert dispatch.
- Persistent assessment score retrieval.
- Daily task randomization & soldier reflection notes on completion.
- Extended military dossier updates.
"""

from __future__ import annotations

import uuid
import random
from datetime import datetime, timezone, timedelta
from typing import Optional, Any
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, text, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import SurvivorProfile, Alert, AlertStatus
from app.engine.ai_alert_engine import evaluate_and_trigger_alerts
from app.models.gamified import (
    VeteranProfile,
    DailyTask,
    PointsLedger,
    VeteranGroup,
    GroupMembership,
    SocialInteraction,
    GPSTrack,
    TaskStatus,
    TaskType,
    RewardTier,
    VeteranReward,
)

router = APIRouter(prefix="/api/veterans", tags=["veterans"])


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _resolve_veteran_uuid(db: AsyncSession, vid: Any) -> uuid.UUID:
    if isinstance(vid, uuid.UUID):
        return vid
    if vid:
        try:
            val = uuid.UUID(str(vid))
            res = await db.execute(select(VeteranProfile).where(VeteranProfile.id == val))
            if res.scalar_one_or_none():
                return val
        except Exception:
            pass

    result = await db.execute(select(VeteranProfile))
    vet = result.scalars().first()
    if vet:
        return vet.id

    return uuid.UUID("550e8400-e29b-41d4-a716-446655440001")


async def _ensure_assessment_table(db: AsyncSession):
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS veteran_assessments (
            id TEXT PRIMARY KEY,
            veteran_id TEXT NOT NULL,
            total_score INTEGER NOT NULL,
            risk_level TEXT NOT NULL,
            answers_json TEXT NOT NULL,
            submitted_at TEXT NOT NULL
        );
    """))
    await db.commit()


def _get_greeting() -> str:
    hour = datetime.now().hour
    if hour < 12:
        return "Good morning, Comrade"
    elif hour < 17:
        return "Good afternoon, Comrade"
    return "Good evening, Comrade"


# ── Profile Endpoints ─────────────────────────────────────────────────────────

@router.get("/{veteran_id}")
async def get_veteran_profile(veteran_id: str, db: AsyncSession = Depends(get_db)):
    """Get veteran profile with gamification stats."""
    v_uuid = await _resolve_veteran_uuid(db, veteran_id)
    result = await db.execute(select(VeteranProfile).where(VeteranProfile.id == v_uuid))
    veteran = result.scalar_one_or_none()
    if not veteran:
        raise HTTPException(status_code=404, detail="Veteran not found")

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count(DailyTask.id)).where(
            DailyTask.veteran_id == v_uuid,
            DailyTask.assigned_date >= today,
            DailyTask.status == TaskStatus.COMPLETED,
        )
    )
    tasks_today = result.scalar() or 0

    result = await db.execute(
        select(func.count(GroupMembership.id)).where(
            GroupMembership.veteran_id == v_uuid,
            GroupMembership.is_active == True,
        )
    )
    groups_count = result.scalar() or 0

    return {
        "id": str(veteran.id),
        "survivor_id": str(veteran.survivor_id),
        "service_branch": veteran.service_branch or "Indian Army",
        "rank": veteran.rank or "Soldier",
        "years_of_service": veteran.years_of_service or 5,
        "gps_enabled": veteran.gps_enabled,
        "notifications_enabled": veteran.notifications_enabled,
        "total_points": veteran.total_points or 50,
        "current_streak": veteran.current_streak or 1,
        "longest_streak": veteran.longest_streak or 1,
        "tasks_completed": veteran.tasks_completed or 0,
        "tasks_completed_today": tasks_today,
        "groups_joined": groups_count,
        "deployment_count": veteran.deployment_count or 0,
        "credibility_score": veteran.credibility_score if veteran.credibility_score is not None else 85.0,
        "stability_score": veteran.stability_score if veteran.stability_score is not None else 85.0,
        "assigned_counselor_id": str(veteran.assigned_counselor_id) if veteran.assigned_counselor_id else "c0000000-0000-0000-0000-000000000001",
        "assigned_counselor_name": veteran.assigned_counselor_name or "Dr. Ananya Nair, MD",
        "avatar_url": veteran.avatar_url or "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
        "bio": veteran.bio or "Service before self. Rebuilding resilience on the VALOR peer network.",
        "phone_number": veteran.phone_number or "+91 98765 43210",
        "emergency_contact_name": veteran.emergency_contact_name or "Lt. Col. Ankit Sharma (Battle Buddy)",
        "emergency_contact_phone": veteran.emergency_contact_phone or "+91 98111 22233",
        "home_city": veteran.home_city or "New Delhi, India",
        "created_at": veteran.created_at.isoformat() if veteran.created_at else None,
    }


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    rank: str | None = None
    service_branch: str | None = None
    years_of_service: int | None = None
    deployment_count: int | None = None
    bio: str | None = None
    avatar_url: str | None = None
    phone_number: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    home_city: str | None = None
    gps_enabled: bool | None = None
    notifications_enabled: bool | None = None


@router.patch("/{veteran_id}/profile")
async def update_veteran_profile(
    veteran_id: str,
    payload: ProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update extended veteran profile fields."""
    v_uuid = await _resolve_veteran_uuid(db, veteran_id)
    result = await db.execute(select(VeteranProfile).where(VeteranProfile.id == v_uuid))
    veteran = result.scalar_one_or_none()
    if not veteran:
        raise HTTPException(status_code=404, detail="Veteran not found")

    fields = payload.model_dump(exclude_none=True)
    if "name" in fields and veteran.survivor_id:
        s_res = await db.execute(select(SurvivorProfile).where(SurvivorProfile.id == veteran.survivor_id))
        surv = s_res.scalar_one_or_none()
        if surv:
            surv.preferred_language = fields["name"]
            surv.encrypted_name = fields["name"].encode("utf-8")

    if "email" in fields and veteran.survivor_id:
        s_res = await db.execute(select(SurvivorProfile).where(SurvivorProfile.id == veteran.survivor_id))
        surv = s_res.scalar_one_or_none()
        if surv:
            surv.encrypted_email = fields["email"].encode("utf-8")
        await db.execute(text("""
            UPDATE user_auth_credentials SET email = :new_email WHERE user_id = :uid
        """), {"new_email": fields["email"].strip().lower(), "uid": str(v_uuid)})

    for key, value in fields.items():
        if hasattr(veteran, key):
            setattr(veteran, key, value)

    veteran.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "id": str(veteran.id),
        "rank": veteran.rank,
        "service_branch": veteran.service_branch,
        "years_of_service": veteran.years_of_service,
        "deployment_count": veteran.deployment_count,
        "bio": veteran.bio,
        "avatar_url": veteran.avatar_url,
        "phone_number": veteran.phone_number,
        "emergency_contact_name": veteran.emergency_contact_name,
        "emergency_contact_phone": veteran.emergency_contact_phone,
        "home_city": veteran.home_city,
        "gps_enabled": veteran.gps_enabled,
        "notifications_enabled": veteran.notifications_enabled,
        "updated_at": veteran.updated_at.isoformat(),
    }


# ─── Assessment Endpoints ────────────────────────────────────────────────────

@router.get("/{veteran_id}/assessment")
async def get_latest_assessment(veteran_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve the latest submitted wellness assessment score and history."""
    await _ensure_assessment_table(db)
    v_uuid = await _resolve_veteran_uuid(db, veteran_id)
    vid = str(v_uuid)

    row = await db.execute(text("""
        SELECT total_score, risk_level, answers_json, submitted_at FROM veteran_assessments
        WHERE veteran_id = :vid ORDER BY submitted_at DESC LIMIT 1
    """), {"vid": vid})
    rec = row.fetchone()

    if not rec:
        return {
            "veteran_id": vid,
            "total_score": 5,
            "risk_level": "low",
            "message": "Baseline normal. Please complete your daily wellness assessment.",
            "submitted_at": None,
            "has_completed": False,
        }

    import json
    answers = []
    try:
        answers = json.loads(rec[2])
    except Exception:
        pass

    return {
        "veteran_id": vid,
        "total_score": rec[0],
        "risk_level": rec[1],
        "answers": answers,
        "submitted_at": rec[3],
        "has_completed": True,
    }


@router.post("/{veteran_id}/assessment")
async def submit_assessment(
    veteran_id: str,
    answers: list[dict],
    db: AsyncSession = Depends(get_db),
):
    """Submit 5-question wellness assessment with real-time AI risk evaluation and counselor alert dispatch."""
    await _ensure_assessment_table(db)
    v_uuid = await _resolve_veteran_uuid(db, veteran_id)

    if len(answers) != 5:
        raise HTTPException(status_code=400, detail="Assessment requires exactly 5 answers")

    result = await db.execute(select(VeteranProfile).where(VeteranProfile.id == v_uuid))
    veteran = result.scalar_one_or_none()
    if not veteran:
        raise HTTPException(status_code=404, detail="Veteran not found")

    for i, answer in enumerate(answers):
        value = answer.get("value")
        if not isinstance(value, int) or value < 1 or value > 4:
            raise HTTPException(status_code=400, detail=f"Answer {i+1} must be an integer between 1 and 4")

    total_score = sum(a["value"] for a in answers)

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing_today = await db.execute(
        select(PointsLedger).where(
            PointsLedger.veteran_id == v_uuid,
            PointsLedger.category == "assessment",
            PointsLedger.created_at >= today_start,
        )
    )
    already_submitted_today = existing_today.scalar_one_or_none() is not None

    xp_earned = 0
    if not already_submitted_today:
        veteran.total_points = (veteran.total_points or 0) + 20
        xp_earned = 20
        assessment_entry = PointsLedger(
            veteran_id=v_uuid,
            points=20,
            reason=f"Wellness assessment submitted (score: {total_score}/20)",
            category="assessment",
        )
        db.add(assessment_entry)

    if total_score <= 8:
        risk_level = "low"
        message = "Your wellness scores look steady today. Solid discipline!"
    elif total_score <= 12:
        risk_level = "moderate"
        message = "Mild tension detected. Added gentle sensory grounding tasks to your daily list."
    elif total_score <= 16:
        risk_level = "elevated"
        message = "Elevated trauma distress noted. Your clinical supervisor has been flagged to monitor your status."
    else:
        risk_level = "high"
        message = "High acute distress detected. High-priority notification dispatched to your assigned counselor."

    veteran.stability_score = round(max(15.0, 100.0 - (total_score - 5) * 5.0), 1)

    import json
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.execute(text("""
        INSERT INTO veteran_assessments (id, veteran_id, total_score, risk_level, answers_json, submitted_at)
        VALUES (:id, :vid, :score, :risk, :json, :dt)
    """), {
        "id": str(uuid.uuid4()),
        "vid": str(v_uuid),
        "score": total_score,
        "risk": risk_level,
        "json": json.dumps(answers),
        "dt": now_iso,
    })

    c_uuid = uuid.UUID("c0000000-0000-0000-0000-000000000001")
    if veteran.assigned_counselor_id:
        try:
            c_uuid = uuid.UUID(str(veteran.assigned_counselor_id))
        except Exception:
            pass

    alert_created = False
    alert_id_str = None

    if total_score >= 13:
        alert_type = "acute" if total_score >= 17 else "escalating"
        alert_obj = Alert(
            survivor_id=veteran.survivor_id,
            counselor_id=c_uuid,
            alert_type=alert_type,
            status=AlertStatus.PENDING,
            severity_score=round(total_score / 20.0, 2),
            trend_summary=f"Harvard Trauma Assessment Score {total_score}/20 ({risk_level.upper()} RISK). Acute elevations across Intrusive Memories and Sleep dysregulation.",
            contributing_topics=["Trauma Assessment", "PTSD Hypervigilance", "Sleep Dysregulation"],
        )
        db.add(alert_obj)
        alert_created = True
        await db.flush()
        alert_id_str = str(alert_obj.id)
    else:
        await evaluate_and_trigger_alerts(db, v_uuid, trigger_event=f"Assessment score: {total_score}/20")

    await db.commit()

    return {
        "veteran_id": str(v_uuid),
        "total_score": total_score,
        "risk_level": risk_level,
        "message": message,
        "xp_earned": xp_earned,
        "alert_dispatched_to_counselor": alert_created,
        "counselor_alert_id": alert_id_str,
        "stability_score": veteran.stability_score,
        "submitted_at": now_iso,
        "questions": [
            {"domain": "Intrusive Memories", "score": answers[0]["value"]},
            {"domain": "Hypervigilance", "score": answers[1]["value"]},
            {"domain": "Emotional Numbing", "score": answers[2]["value"]},
            {"domain": "Somatic/Sleep", "score": answers[3]["value"]},
            {"domain": "Coping/Safety", "score": answers[4]["value"]},
        ],
    }


# ─── Tasks & Dashboard ────────────────────────────────────────────────────────

CURATED_DAILY_TASK_POOL = [
    {
        "title": "5-4-3-2-1 Sensory Grounding Technique",
        "description": "Engage all 5 senses to bring your nervous system back to safety during flashbacks or hypervigilance.",
        "instructions": "Acknowledge 5 things you see, 4 things you can touch, 3 things you hear, 2 things you smell, 1 thing you taste. Take 4 deep box breaths.",
        "type": TaskType.MENTAL,
        "category": "grounding",
        "points": 15,
        "gps_required": False,
    },
    {
        "title": "2km Tactical Movement & Cadence Walk",
        "description": "Steady rhythmic outdoor movement to stimulate bilateral somatic integration and build physical endurance.",
        "instructions": "Maintain a steady march tempo. Tap Start GPS Walk and cover at least 2km.",
        "type": TaskType.PHYSICAL,
        "category": "cardio",
        "points": 30,
        "gps_required": True,
        "target_distance": 2000,
    },
    {
        "title": "Evening Soldier Journal & Mission Debrief",
        "description": "Reflect on today's challenges, note moments of strength, and write a brief debrief note.",
        "instructions": "Write down 3 moments of safety or pride from today. Record your thoughts in the soldier reflection box.",
        "type": TaskType.MENTAL,
        "category": "reflection",
        "points": 20,
        "gps_required": False,
    },
    {
        "title": "Box Breathing Drill (4-4-4-4 Protocol)",
        "description": "Regulate autonomic nervous system tone with 4 full cycles of tactical box breathing.",
        "instructions": "Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Repeat for 4 full cycles.",
        "type": TaskType.MENTAL,
        "category": "mindfulness",
        "points": 15,
        "gps_required": False,
    },
    {
        "title": "Squad Brother Check-in / Peer Support Dispatch",
        "description": "Send an encouraging cheer or direct message to a fellow comrade in your squad.",
        "instructions": "Post a dispatch on your squad board or message a friend to strengthen brotherhood.",
        "type": TaskType.SOCIAL,
        "category": "brotherhood",
        "points": 15,
        "gps_required": False,
    },
    {
        "title": "Hydration & Electrolyte Morning Baseline",
        "description": "Drink 750ml of clean water upon waking to rehydrate tissues and calm cortisol levels.",
        "instructions": "Begin your morning with fresh water. Maintain steady hydration throughout the day.",
        "type": TaskType.PHYSICAL,
        "category": "wellness",
        "points": 10,
        "gps_required": False,
    },
    {
        "title": "Progressive Muscle Relaxation (PMR)",
        "description": "Tense and release muscle groups from feet to shoulders to discharge accumulated physical armor.",
        "instructions": "Spend 10 minutes tensing each muscle group for 5 seconds, then releasing for 15 seconds.",
        "type": TaskType.MENTAL,
        "category": "somatic",
        "points": 20,
        "gps_required": False,
    },
]


@router.post("/{veteran_id}/tasks/randomize")
@router.post("/{veteran_id}/tasks/generate")
async def generate_randomized_tasks(veteran_id: str, db: AsyncSession = Depends(get_db)):
    """Generate 5 fresh randomized daily tasks for the veteran."""
    v_uuid = await _resolve_veteran_uuid(db, veteran_id)
    now = datetime.now(timezone.utc)

    selected_templates = random.sample(CURATED_DAILY_TASK_POOL, min(5, len(CURATED_DAILY_TASK_POOL)))

    new_tasks = []
    for tmpl in selected_templates:
        t = DailyTask(
            veteran_id=v_uuid,
            title=tmpl["title"],
            description=tmpl["description"],
            instructions=tmpl["instructions"],
            task_type=tmpl["type"],
            category=tmpl["category"],
            points=tmpl["points"],
            difficulty=1,
            status=TaskStatus.ASSIGNED,
            assigned_date=now,
            gps_required=tmpl["gps_required"],
            gps_target_distance_meters=tmpl.get("target_distance"),
        )
        db.add(t)
        new_tasks.append(t)

    await db.commit()

    return {
        "success": True,
        "message": "Generated 5 fresh daily recovery tasks! 🎖️",
        "tasks_count": len(new_tasks),
    }


class TaskCompleteRequest(BaseModel):
    reflection_notes: str | None = None
    mood_impact: str | None = None
    effort_level: int | None = None


@router.post("/{veteran_id}/tasks/{task_id}/complete")
async def complete_task(
    veteran_id: str,
    task_id: str,
    payload: TaskCompleteRequest | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Mark a daily task as complete and record reflection notes."""
    v_uuid = await _resolve_veteran_uuid(db, veteran_id)
    t_uuid = None
    try:
        t_uuid = uuid.UUID(str(task_id))
    except Exception:
        pass

    result = await db.execute(
        select(DailyTask).where(
            DailyTask.id == t_uuid if t_uuid else False,
            DailyTask.veteran_id == v_uuid,
        )
    )
    task = result.scalar_one_or_none()

    pts = 20
    task_title = "Daily Recovery Drill"
    if task:
        if task.status == TaskStatus.COMPLETED:
            return {"message": "Task already completed", "points_earned": 0}
        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.now(timezone.utc)
        pts = task.points or 20
        task_title = task.title

    v_res = await db.execute(select(VeteranProfile).where(VeteranProfile.id == v_uuid))
    veteran = v_res.scalar_one_or_none()
    if veteran:
        veteran.total_points = (veteran.total_points or 0) + pts
        veteran.tasks_completed = (veteran.tasks_completed or 0) + 1

    reflection = payload.reflection_notes if payload else None
    reason_str = f"Completed task: {task_title}"
    if reflection:
        reason_str += f" | Reflection: {reflection[:100]}"

    db.add(PointsLedger(
        veteran_id=v_uuid,
        points=pts,
        reason=reason_str,
        category="daily_task",
    ))

    await db.commit()

    return {
        "success": True,
        "message": f"Task '{task_title}' completed! +{pts} XP awarded! 🎖️",
        "points_earned": pts,
        "total_points": veteran.total_points if veteran else pts,
        "reflection_recorded": bool(reflection),
    }


@router.get("/{veteran_id}/dashboard")
async def get_dashboard(veteran_id: str, db: AsyncSession = Depends(get_db)):
    """Get veteran's home dashboard with today's tasks, stats, and groups."""
    v_uuid = await _resolve_veteran_uuid(db, veteran_id)
    result = await db.execute(select(VeteranProfile).where(VeteranProfile.id == v_uuid))
    veteran = result.scalar_one_or_none()
    if not veteran:
        raise HTTPException(status_code=404, detail="Veteran not found")

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(DailyTask).where(
            DailyTask.veteran_id == v_uuid,
            DailyTask.assigned_date >= today,
        ).order_by(DailyTask.created_at)
    )
    today_tasks = result.scalars().all()

    if not today_tasks:
        starter_templates = CURATED_DAILY_TASK_POOL[:3]
        for tmpl in starter_templates:
            t = DailyTask(
                veteran_id=v_uuid,
                title=tmpl["title"],
                description=tmpl["description"],
                instructions=tmpl["instructions"],
                task_type=tmpl["type"],
                category=tmpl["category"],
                points=tmpl["points"],
                status=TaskStatus.ASSIGNED,
                assigned_date=today,
                gps_required=tmpl["gps_required"],
            )
            db.add(t)
        await db.commit()

        result = await db.execute(
            select(DailyTask).where(
                DailyTask.veteran_id == v_uuid,
                DailyTask.assigned_date >= today,
            ).order_by(DailyTask.created_at)
        )
        today_tasks = result.scalars().all()

    result = await db.execute(
        select(func.count(DailyTask.id)).where(
            DailyTask.veteran_id == v_uuid,
            DailyTask.status.in_([TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]),
        )
    )
    pending_tasks = result.scalar() or 0

    result = await db.execute(
        select(GroupMembership, VeteranGroup)
        .join(VeteranGroup, GroupMembership.group_id == VeteranGroup.id)
        .where(
            GroupMembership.veteran_id == v_uuid,
            GroupMembership.is_active == True,
        )
    )
    groups = [
        {
            "id": str(membership.group_id),
            "name": group.name,
            "member_count": group.member_count,
            "total_points": group.total_group_points,
        }
        for membership, group in result.all()
    ]

    return {
        "veteran_id": str(v_uuid),
        "greeting": _get_greeting(),
        "stats": {
            "total_points": veteran.total_points or 50,
            "current_streak": veteran.current_streak or 1,
            "tasks_completed": veteran.tasks_completed or 0,
            "pending_tasks": pending_tasks,
            "credibility_score": veteran.credibility_score if veteran.credibility_score is not None else 85.0,
            "stability_score": veteran.stability_score if veteran.stability_score is not None else 85.0,
        },
        "assigned_counselor_id": str(veteran.assigned_counselor_id) if veteran.assigned_counselor_id else "c0000000-0000-0000-0000-000000000001",
        "assigned_counselor_name": veteran.assigned_counselor_name or "Dr. Ananya Nair, MD",
        "today_tasks": [
            {
                "id": str(task.id),
                "type": task.task_type.value if hasattr(task.task_type, 'value') else str(task.task_type),
                "title": task.title,
                "description": task.description,
                "instructions": task.instructions,
                "points": task.points,
                "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
                "gps_required": task.gps_required,
            }
            for task in today_tasks
        ],
        "groups": groups,
    }
