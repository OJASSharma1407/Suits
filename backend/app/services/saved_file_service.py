"""SavedFile service - business logic for files & research vault."""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.saved_file_repository import SavedFileRepository
from app.schemas.saved_file import (
    SaveFileRequest,
    UpdateFileRequest,
    SavedFileResponse,
    SavedFileListResponse,
)


class SavedFileService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = SavedFileRepository(db)

    async def list_files(
        self,
        user_id: uuid.UUID,
        search_query: str | None = None,
        tag: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> SavedFileListResponse:
        files = await self.repo.get_user_files(
            user_id=user_id,
            search_query=search_query,
            tag=tag,
            limit=limit,
            offset=offset,
        )
        return SavedFileListResponse(
            items=[SavedFileResponse.model_validate(f) for f in files],
            total=len(files),
        )

    async def get_file(self, user_id: uuid.UUID, file_id: uuid.UUID) -> SavedFileResponse:
        saved_file = await self.repo.get_by_id(user_id, file_id)
        if not saved_file:
            raise NotFoundError("SavedFile")
        return SavedFileResponse.model_validate(saved_file)

    async def get_by_case(
        self, user_id: uuid.UUID, cnr: str, filename: str
    ) -> SavedFileResponse | None:
        saved_file = await self.repo.get_by_cnr_filename(user_id, cnr, filename)
        if not saved_file:
            return None
        return SavedFileResponse.model_validate(saved_file)

    async def save_file(
        self, user_id: uuid.UUID, req: SaveFileRequest
    ) -> SavedFileResponse:
        saved_file = await self.repo.save_or_update(
            user_id=user_id,
            cnr=req.cnr,
            filename=req.filename,
            case_title=req.case_title,
            court_name=req.court_name,
            order_date=req.order_date,
            notes=req.notes,
            highlights=req.highlights,
            tags=req.tags,
        )
        return SavedFileResponse.model_validate(saved_file)

    async def update_file(
        self, user_id: uuid.UUID, file_id: uuid.UUID, req: UpdateFileRequest
    ) -> SavedFileResponse:
        updated = await self.repo.update(
            user_id=user_id,
            file_id=file_id,
            notes=req.notes,
            highlights=req.highlights,
            tags=req.tags,
            case_title=req.case_title,
            court_name=req.court_name,
            order_date=req.order_date,
        )
        if not updated:
            raise NotFoundError("SavedFile")
        return SavedFileResponse.model_validate(updated)

    async def delete_file(self, user_id: uuid.UUID, file_id: uuid.UUID) -> None:
        deleted = await self.repo.delete(user_id, file_id)
        if not deleted:
            raise NotFoundError("SavedFile")

    async def delete_by_case(
        self, user_id: uuid.UUID, cnr: str, filename: str
    ) -> None:
        deleted = await self.repo.delete_by_cnr_filename(user_id, cnr, filename)
        if not deleted:
            raise NotFoundError("SavedFile")
