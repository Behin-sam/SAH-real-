"""Comprehensive test suite for VALOR Communication, Squads & Role Separation.

Tests:
1. Counselor ↔ Veteran Chat (bi-directional, persistence, caseload/conversation isolation)
2. Squad Creation & Ownership (stored as admin/owner)
3. Squad Membership & Access Protection
4. Squad Task Creation & Assignment to Squad Members
5. Squad Task Hard Cap (5 Max Active Tasks):
   - 1st to 5th task creations succeed
   - 6th active task creation is rejected with HTTP 400
   - Completing an active task allows a new task to be created
6. Squad Task Rejection for non-member assignees
7. Squad Chat (restricted to squad members)
8. Role Separation & Authorization enforcement
"""

import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.database import Base, get_db, engine, async_session_factory
from app.models import SurvivorProfile
from app.models.gamified import VeteranProfile, VeteranGroup, GroupMembership, GroupRole, SquadTask
from app.models.chat import CounselorProfile, ChatConversation, ChatMessage


@pytest_asyncio.fixture(autouse=True)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture
async def test_db_session():
    async with async_session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_counselor_veteran_chat_flow(client: AsyncClient, test_db_session: AsyncSession):
    """Test bi-directional communication between counselor and assigned veteran."""
    counselor_id = uuid.uuid4()
    survivor_id = uuid.uuid4()
    veteran_id = uuid.uuid4()

    survivor = SurvivorProfile(id=survivor_id)
    counselor = CounselorProfile(
        id=counselor_id,
        name="Dr. Anita Sharma",
        email="anita@valor.mil",
        specialization="Trauma & PTSD",
        is_available=True
    )
    veteran = VeteranProfile(
        id=veteran_id,
        survivor_id=survivor_id,
        assigned_counselor_id=str(counselor_id),
        assigned_counselor_name="Dr. Anita Sharma",
        rank="Captain",
        service_branch="Indian Army"
    )
    test_db_session.add_all([survivor, counselor, veteran])
    await test_db_session.commit()

    # 1. Veteran sends message to Counselor
    vet_send_res = await client.post("/api/chat/messages", json={
        "veteran_id": str(veteran_id),
        "sender_type": "veteran",
        "content": "Good morning doctor, feeling steady today."
    })
    assert vet_send_res.status_code in (200, 201)
    msg1 = vet_send_res.json()
    assert msg1["sender_type"] == "veteran"
    assert msg1["content"] == "Good morning doctor, feeling steady today."
    assert msg1["veteran_id"] == str(veteran_id)
    assert msg1["counselor_id"] == str(counselor_id)

    # 2. Counselor sends reply to Veteran
    counselor_send_res = await client.post("/api/chat/messages", json={
        "veteran_id": str(veteran_id),
        "sender_type": "counselor",
        "counselor_id": str(counselor_id),
        "content": "Glad to hear that, Captain. Keep up the morning drill."
    })
    assert counselor_send_res.status_code in (200, 201)
    msg2 = counselor_send_res.json()
    assert msg2["sender_type"] == "counselor"
    assert msg2["content"] == "Glad to hear that, Captain. Keep up the morning drill."

    # 3. Retrieve chat history for this veteran
    history_res = await client.get("/api/chat/messages", params={"veteran_id": str(veteran_id)})
    assert history_res.status_code == 200
    messages = history_res.json()["messages"]
    assert len(messages) >= 2
    contents = [m["content"] for m in messages]
    assert "Good morning doctor, feeling steady today." in contents
    assert "Glad to hear that, Captain. Keep up the morning drill." in contents

    # 4. Unauthorized counselor attempting to send message to unassigned veteran
    unauth_send_res = await client.post("/api/chat/messages", json={
        "veteran_id": str(veteran_id),
        "sender_type": "counselor",
        "counselor_id": str(uuid.uuid4()),
        "content": "I am not your counselor."
    })
    assert unauth_send_res.status_code == 403


@pytest.mark.asyncio
async def test_squad_creation_and_membership(client: AsyncClient, test_db_session: AsyncSession):
    """Test squad creation with creator stored as admin/owner."""
    s1, s2 = SurvivorProfile(id=uuid.uuid4()), SurvivorProfile(id=uuid.uuid4())
    vet1 = VeteranProfile(id=uuid.uuid4(), survivor_id=s1.id, service_branch="Indian Army")
    vet2 = VeteranProfile(id=uuid.uuid4(), survivor_id=s2.id, service_branch="Indian Navy")
    test_db_session.add_all([s1, s2, vet1, vet2])
    await test_db_session.commit()

    # Create squad
    create_res = await client.post("/api/groups", json={
        "name": "Siachen Patrol",
        "description": "High altitude endurance recovery circle.",
        "created_by": str(vet1.id),
        "max_members": 20,
        "is_public": True
    })
    assert create_res.status_code in (200, 201)
    group_data = create_res.json()
    group_id = group_data["id"]
    assert group_data["name"] == "Siachen Patrol"

    # Check creator is admin member in roster
    members_res = await client.get(f"/api/groups/{group_id}/members")
    assert members_res.status_code == 200
    members = members_res.json()["members"]
    assert len(members) == 1
    assert members[0]["veteran_id"] == str(vet1.id)
    assert members[0]["role"] == "admin"

    # Veteran 2 joins squad
    join_res = await client.post(f"/api/groups/{group_id}/join", params={"veteran_id": str(vet2.id)})
    assert join_res.status_code == 200

    # Roster now has 2 members
    members_res2 = await client.get(f"/api/groups/{group_id}/members")
    assert len(members_res2.json()["members"]) == 2


@pytest.mark.asyncio
async def test_squad_tasks_hard_cap_and_workflow(client: AsyncClient, test_db_session: AsyncSession):
    """Test squad task creation, 5-task hard cap, assignment, and completion."""
    s1, s2, s3 = SurvivorProfile(id=uuid.uuid4()), SurvivorProfile(id=uuid.uuid4()), SurvivorProfile(id=uuid.uuid4())
    vet1 = VeteranProfile(id=uuid.uuid4(), survivor_id=s1.id)
    vet2 = VeteranProfile(id=uuid.uuid4(), survivor_id=s2.id)
    vet_outsider = VeteranProfile(id=uuid.uuid4(), survivor_id=s3.id)
    test_db_session.add_all([s1, s2, s3, vet1, vet2, vet_outsider])
    await test_db_session.commit()

    # 1. Create squad
    squad_res = await client.post("/api/groups", json={
        "name": "Alpha Squadron",
        "created_by": str(vet1.id),
        "description": "Squadron for tactical wellness."
    })
    group_id = squad_res.json()["id"]

    # Member joins squad
    await client.post(f"/api/groups/{group_id}/join", params={"veteran_id": str(vet2.id)})

    # 2. Reject task assignment to non-member
    bad_assign_res = await client.post(f"/api/groups/{group_id}/tasks", json={
        "title": "Drill for outsider",
        "created_by": str(vet1.id),
        "assigned_to": str(vet_outsider.id)
    })
    assert bad_assign_res.status_code == 400
    assert "Assigned veteran is not a member" in bad_assign_res.json()["detail"] or "Assigned veteran must be a member" in bad_assign_res.json()["detail"]

    # 3. Create 5 active tasks (should all succeed)
    task_ids = []
    for i in range(1, 6):
        res = await client.post(f"/api/groups/{group_id}/tasks", json={
            "title": f"Active Drill {i}",
            "description": f"Perform drill number {i}",
            "created_by": str(vet1.id),
            "assigned_to": str(vet2.id),
            "points": 20
        })
        assert res.status_code in (200, 201)
        task_ids.append(res.json()["id"])

    # Verify task count is 5 active
    tasks_res = await client.get(f"/api/groups/{group_id}/tasks", params={"veteran_id": str(vet2.id)})
    assert tasks_res.status_code == 200
    data = tasks_res.json()
    assert data["active_tasks_count"] == 5
    assert len(data["tasks"]) == 5

    # 4. Attempt 6th active task creation -> MUST FAIL with HTTP 400
    sixth_res = await client.post(f"/api/groups/{group_id}/tasks", json={
        "title": "Active Drill 6 (Should fail)",
        "created_by": str(vet1.id),
        "assigned_to": str(vet2.id),
        "points": 20
    })
    assert sixth_res.status_code == 400
    assert "Squad task limit reached" in sixth_res.json()["detail"]

    # 5. Complete 1 task -> freeing up a slot
    first_task_id = task_ids[0]
    complete_res = await client.post(
        f"/api/groups/{group_id}/tasks/{first_task_id}/complete",
        params={"veteran_id": str(vet2.id)}
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"

    # Active count is now 4
    tasks_res_after = await client.get(f"/api/groups/{group_id}/tasks", params={"veteran_id": str(vet2.id)})
    assert tasks_res_after.json()["active_tasks_count"] == 4

    # 6. Now creating the new task succeeds!
    new_task_res = await client.post(f"/api/groups/{group_id}/tasks", json={
        "title": "Active Drill 6 (Now succeeding)",
        "created_by": str(vet1.id),
        "assigned_to": str(vet2.id),
        "points": 25
    })
    assert new_task_res.status_code in (200, 201)
    assert new_task_res.json()["title"] == "Active Drill 6 (Now succeeding)"

    # Total active tasks is 5 again
    final_tasks = await client.get(f"/api/groups/{group_id}/tasks", params={"veteran_id": str(vet2.id)})
    assert final_tasks.json()["active_tasks_count"] == 5
    assert final_tasks.json()["total"] == 6  # 5 active + 1 completed


@pytest.mark.asyncio
async def test_squad_chat_and_security(client: AsyncClient, test_db_session: AsyncSession):
    """Test squad chat isolation to members only and message persistence."""
    s1, s2, s3 = SurvivorProfile(id=uuid.uuid4()), SurvivorProfile(id=uuid.uuid4()), SurvivorProfile(id=uuid.uuid4())
    vet1 = VeteranProfile(id=uuid.uuid4(), survivor_id=s1.id, rank="Major")
    vet2 = VeteranProfile(id=uuid.uuid4(), survivor_id=s2.id, rank="Subedar")
    vet_intruder = VeteranProfile(id=uuid.uuid4(), survivor_id=s3.id)
    test_db_session.add_all([s1, s2, s3, vet1, vet2, vet_intruder])
    await test_db_session.commit()

    # Create private squad
    squad_res = await client.post("/api/groups", json={
        "name": "Bravo Company",
        "created_by": str(vet1.id),
        "is_public": False
    })
    group_id = squad_res.json()["id"]

    # Member 2 joins
    await client.post(f"/api/groups/{group_id}/join", params={"veteran_id": str(vet2.id)})

    # Post message from member 1
    post_res = await client.post(
        f"/api/groups/{group_id}/messages",
        params={
            "sender_id": str(vet1.id),
            "message": "Report for evening muster comrades.",
            "sender_name": "Major Rathore",
            "sender_rank": "Major"
        }
    )
    assert post_res.status_code in (200, 201)

    # Member 2 reads chat -> Allowed
    chat_res = await client.get(f"/api/groups/{group_id}/messages", params={"veteran_id": str(vet2.id)})
    assert chat_res.status_code == 200
    assert len(chat_res.json()["messages"]) == 1
    assert chat_res.json()["messages"][0]["message"] == "Report for evening muster comrades."

    # Non-member attempts to post message -> Rejected 403
    intruder_post = await client.post(
        f"/api/groups/{group_id}/messages",
        params={
            "sender_id": str(vet_intruder.id),
            "message": "I should not be able to post here."
        }
    )
    assert intruder_post.status_code == 403

    # Non-member attempts to read private chat -> Rejected 403
    intruder_read = await client.get(f"/api/groups/{group_id}/messages", params={"veteran_id": str(vet_intruder.id)})
    assert intruder_read.status_code == 403
