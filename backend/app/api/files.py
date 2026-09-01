"""Files router - Save, List, Update, and Delete saved court orders & research notes."""

import uuid
from fastapi import APIRouter, Query

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.saved_file import (
    SaveFileRequest,
    UpdateFileRequest,
    SavedFileResponse,
    SavedFileListResponse,
)
from app.schemas.common import APIResponse
from app.services.saved_file_service import SavedFileService

router = APIRouter(prefix="/files", tags=["Files & Research Vault"])


@router.get("", response_model=APIResponse[SavedFileListResponse])
async def list_files(
    user: CurrentUser,
    db: DbSession,
    q: str | None = Query(default=None, description="Search query across titles, CNR, and notes"),
    tag: str | None = Query(default=None, description="Filter by tag"),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    service = SavedFileService(db)
    result = await service.list_files(
        user_id=user.id,
        search_query=q,
        tag=tag,
        limit=limit,
        offset=offset,
    )
    return APIResponse(data=result)


@router.post("", response_model=APIResponse[SavedFileResponse])
async def save_file(
    request: SaveFileRequest,
    user: CurrentUser,
    db: DbSession,
):
    service = SavedFileService(db)
    saved = await service.save_file(user_id=user.id, req=request)
    return APIResponse(data=saved, message="Order saved to Files Vault.")


@router.get("/case/{cnr}/{filename:path}", response_model=APIResponse[SavedFileResponse | None])
async def get_file_by_case(
    cnr: str,
    filename: str,
    user: CurrentUser,
    db: DbSession,
):
    service = SavedFileService(db)
    saved = await service.get_by_case(user_id=user.id, cnr=cnr, filename=filename)
    return APIResponse(data=saved)


@router.get("/{file_id}", response_model=APIResponse[SavedFileResponse])
async def get_file(
    file_id: uuid.UUID,
    user: CurrentUser,
    db: DbSession,
):
    service = SavedFileService(db)
    saved = await service.get_file(user_id=user.id, file_id=file_id)
    return APIResponse(data=saved)


@router.patch("/{file_id}", response_model=APIResponse[SavedFileResponse])
async def update_file(
    file_id: uuid.UUID,
    request: UpdateFileRequest,
    user: CurrentUser,
    db: DbSession,
):
    service = SavedFileService(db)
    updated = await service.update_file(user_id=user.id, file_id=file_id, req=request)
    return APIResponse(data=updated, message="Research notes updated.")


@router.delete("/{file_id}", response_model=APIResponse)
async def delete_file(
    file_id: uuid.UUID,
    user: CurrentUser,
    db: DbSession,
):
    service = SavedFileService(db)
    await service.delete_file(user_id=user.id, file_id=file_id)
    return APIResponse(message="File removed from vault.")


@router.delete("/case/{cnr}/{filename:path}", response_model=APIResponse)
async def delete_file_by_case(
    cnr: str,
    filename: str,
    user: CurrentUser,
    db: DbSession,
):
    service = SavedFileService(db)
    await service.delete_by_case(user_id=user.id, cnr=cnr, filename=filename)
    return APIResponse(message="File removed from vault.")
