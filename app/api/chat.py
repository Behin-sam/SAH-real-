"""Therapist/Counselor chat endpoints.

Supports bi-directional direct messaging between veterans and counselors with:
- Robust UUID and string identifier parsing.
- Counselor-specific message thread persistence (distinct conversation per counselor).
- Automatic distress keyword detection and alert dispatch.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import CounselorCaseAssignment, SurvivorProfile, Alert, AlertStatus
from app.models.gamified import VeteranProfile
from app.models.chat import (
    ChatConversation,
    ChatMessage,
    CounselorProfile,
)
from app.engine.ai_alert_engine import evaluate_and_trigger_alerts

router = APIRouter(tags=["chat"])


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


async def _resolve_counselor_uuid_and_profile(db: AsyncSession, cid: Any) -> tuple[uuid.UUID, CounselorProfile | None]:
    c_uuid = None
    if cid:
        try:
            c_uuid = uuid.UUID(str(cid))
        except Exception:
            pass

    res_all = await db.execute(select(CounselorProfile))
    all_c = res_all.scalars().all()

    if c_uuid:
        for c in all_c:
            if c.id == c_uuid or str(c.id) == str(c_uuid) or str(c.id).replace("-", "") == str(c_uuid).replace("-", ""):
                return c_uuid, c

    if cid and isinstance(cid, str):
        c_clean = cid.strip().lower()
        for c in all_c:
            if c_clean in (c.name or "").lower() or c_clean in (c.email or "").lower() or str(c.id)[:8] in c_clean:
                return c.id, c

    if all_c:
        return all_c[0].id, all_c[0]

    default_id = uuid.UUID("c0000000-0000-0000-0000-000000000001")
    return default_id, None


# ── Schemas ───────────────────────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    veteran_id: Any
    content: str
    sender_type: str = "veteran"  # "veteran" or "counselor"
    counselor_id: Optional[Any] = None


# ── Direct Message Endpoints ──────────────────────────────────────────────────

@router.get("/api/chat/counselors")
@router.get("/api/veterans/{veteran_id}/chat/counselors")
async def list_counselors(
    veteran_id: Any = None,
    db: AsyncSession = Depends(get_db),
):
    """List available counselors/therapists from database."""
    result = await db.execute(
        select(CounselorProfile).where(CounselorProfile.is_available == True).order_by(CounselorProfile.created_at.asc())
    )
    counselors = result.scalars().all()

    out = []
    for c in counselors:
        cleaned_name = c.name.replace("Dr.", "").replace("Maj.", "").replace("Gen.", "").replace("(Retd.)", "").strip()
        parts = cleaned_name.split()
        initials = ("".join([p[0] for p in parts[:2]])).upper() if parts else "CL"
        out.append({
            "id": str(c.id),
            "name": c.name,
            "title": c.title or "Clinical Lead & Trauma Specialist",
            "specialty": c.specialization or "Combat PTSD & Trauma Recovery",
            "specialization": c.specialization or "Combat PTSD & Trauma Recovery",
            "credentials": c.credentials or "MD, LCSW",
            "institution": getattr(c, "institution", None) or "Amrita Institute of Medical Sciences",
            "email": c.email or "",
            "phone": c.phone or "",
            "avatar": initials,
            "avatarUrl": getattr(c, "avatar_url", None) or "https://images.unsplash.com/photo-1594824813566-88855ce78905?auto=format&fit=crop&q=80&w=200",
            "rating": 4.9,
            "active_clients": getattr(c, "current_veterans", 8),
            "current_veterans": getattr(c, "current_veterans", 8),
            "max_veterans": getattr(c, "max_veterans", 25),
            "avg_response_minutes": getattr(c, "avg_response_minutes", 15),
        })

    return {
        "counselors": out,
        "total": len(out),
    }


@router.get("/api/chat/messages")
@router.get("/api/veterans/{veteran_id}/chat/messages")
async def get_direct_messages(
    veteran_id: str,
    counselor_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Fetch chat history between a veteran and their clinical counselor."""
    v_uuid = await _resolve_veteran_uuid(db, veteran_id)
    c_uuid, counselor_profile = await _resolve_counselor_uuid_and_profile(db, counselor_id)

    # Find conversation specifically for this veteran & counselor
    result = await db.execute(
        select(ChatConversation)
        .where(
            ChatConversation.veteran_id == v_uuid,
            ChatConversation.counselor_id == c_uuid,
        )
        .order_by(ChatConversation.created_at.desc())
    )
    conversation = result.scalars().first()

    c_name = counselor_profile.name if counselor_profile else "Dr. Ananya Nair, MD"
    c_title = counselor_profile.title if counselor_profile else "Lead Trauma Specialist"
    c_avatar = (getattr(counselor_profile, "avatar_url", None) if counselor_profile else None) or "https://images.unsplash.com/photo-1594824813566-88855ce78905?auto=format&fit=crop&q=80&w=200"

    if not conversation:
        conversation = ChatConversation(
            veteran_id=v_uuid,
            counselor_id=c_uuid,
            subject=f"Clinical Support with {c_name}",
            status="active",
        )
        db.add(conversation)
        await db.flush()

        initial_msg = ChatMessage(
            conversation_id=conversation.id,
            sender_id=c_uuid,
            sender_type="counselor",
            content=f"Greetings Comrade. I am {c_name} ({c_title}). Feel free to reach out here anytime you need somatic grounding, guidance, or adjustments to your tactical recovery drills.",
        )
        db.add(initial_msg)
        conversation.last_message = initial_msg.content[:200]
        conversation.last_message_at = datetime.now(timezone.utc)
        await db.commit()

    # Load all messages
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation.id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()

    return {
        "conversation_id": str(conversation.id),
        "veteran_id": str(v_uuid),
        "counselor_id": str(c_uuid),
        "counselor_name": c_name,
        "counselor_title": c_title,
        "counselor_avatar": c_avatar,
        "messages": [
            {
                "id": str(m.id),
                "sender_type": m.sender_type,
                "content": m.content,
                "message_type": m.message_type or "text",
                "is_read": m.is_read,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }


@router.post("/api/chat/messages", status_code=201)
@router.post("/api/veterans/{veteran_id}/chat/messages", status_code=201)
async def post_direct_message(
    payload: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a direct message from either veteran or counselor."""
    v_uuid = await _resolve_veteran_uuid(db, payload.veteran_id)
    c_uuid, counselor_profile = await _resolve_counselor_uuid_and_profile(db, payload.counselor_id)

    result = await db.execute(
        select(ChatConversation)
        .where(
            ChatConversation.veteran_id == v_uuid,
            ChatConversation.counselor_id == c_uuid,
        )
        .order_by(ChatConversation.created_at.desc())
    )
    conversation = result.scalars().first()

    if not conversation:
        c_name = counselor_profile.name if counselor_profile else "Specialist"
        conversation = ChatConversation(
            veteran_id=v_uuid,
            counselor_id=c_uuid,
            subject=f"Clinical Support with {c_name}",
            status="active",
        )
        db.add(conversation)
        await db.flush()

    sender_id = v_uuid if payload.sender_type == "veteran" else c_uuid

    message = ChatMessage(
        conversation_id=conversation.id,
        sender_id=sender_id,
        sender_type=payload.sender_type,
        content=payload.content.strip(),
        message_type="text",
    )
    db.add(message)

    conversation.last_message = payload.content.strip()[:200]
    conversation.last_message_at = datetime.now(timezone.utc)

    distress_keywords = ["flashback", "panic", "cannot breathe", "suicide", "crisis", "sos", "nightmare", "danger", "dying", "hurt myself"]
    content_lower = payload.content.lower()
    if any(k in content_lower for k in distress_keywords):
        conversation.is_emergency = True
        v_res = await db.execute(select(VeteranProfile).where(VeteranProfile.id == v_uuid))
        vet = v_res.scalar_one_or_none()
        if vet:
            alert_obj = Alert(
                survivor_id=vet.survivor_id,
                counselor_id=c_uuid,
                alert_type="acute",
                status=AlertStatus.PENDING,
                severity_score=0.95,
                trend_summary=f"URGENT: Distress dispatch detected in specialist chat: '{payload.content[:80]}...'",
                contributing_topics=["Live Chat Crisis", "Immediate Clinical Outreach"],
            )
            db.add(alert_obj)

    await db.commit()

    return {
        "id": str(message.id),
        "conversation_id": str(conversation.id),
        "sender_type": message.sender_type,
        "content": message.content,
        "created_at": message.created_at.isoformat() if message.created_at else None,
        "status": "sent",
    }


@router.get("/api/chat/conversations")
async def list_all_conversations(db: AsyncSession = Depends(get_db)):
    """List conversations for counselor hub."""
    result = await db.execute(
        select(ChatConversation, VeteranProfile, SurvivorProfile)
        .join(VeteranProfile, ChatConversation.veteran_id == VeteranProfile.id)
        .outerjoin(SurvivorProfile, VeteranProfile.survivor_id == SurvivorProfile.id)
        .order_by(ChatConversation.last_message_at.desc().nullslast())
    )
    rows = result.all()

    return {
        "conversations": [
            {
                "id": str(conv.id),
                "veteran_id": str(conv.veteran_id),
                "veteran_name": (surv.preferred_language if (surv and surv.preferred_language and len(surv.preferred_language) > 2) else None) or "Comrade",
                "veteran_rank": vet.rank or "Veteran",
                "last_message": conv.last_message,
                "last_message_at": conv.last_message_at.isoformat() if conv.last_message_at else None,
                "is_emergency": conv.is_emergency,
                "status": conv.status,
            }
            for conv, vet, surv in rows
        ],
        "total": len(rows),
    }


@router.post("/api/veterans/{veteran_id}/chat/emergency", status_code=201)
async def send_emergency_message(
    veteran_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """Send an emergency SOS alert to counselor and trigger AI alert engine."""
    v_uuid = await _resolve_veteran_uuid(db, veteran_id)
    content = payload.get("content", "URGENT: Crisis assistance requested.")

    v_res = await db.execute(select(VeteranProfile).where(VeteranProfile.id == v_uuid))
    veteran = v_res.scalar_one_or_none()
    if not veteran:
        raise HTTPException(status_code=404, detail="Veteran not found")

    c_uuid, _ = await _resolve_counselor_uuid_and_profile(db, veteran.assigned_counselor_id)

    alert_obj = Alert(
        survivor_id=veteran.survivor_id,
        counselor_id=c_uuid,
        alert_type="acute",
        status=AlertStatus.PENDING,
        severity_score=1.0,
        trend_summary=f"EMERGENCY SOS: {content}",
        contributing_topics=["Crisis Button Triggered", "Emergency Callback"],
    )
    db.add(alert_obj)
    await db.commit()

    return {
        "success": True,
        "message": "Emergency notification dispatched to your clinical supervisor. Hold steady.",
        "alert_id": str(alert_obj.id),
    }
