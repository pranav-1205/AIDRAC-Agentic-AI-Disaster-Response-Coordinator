from fastapi import APIRouter
from app.ai.schemas import AIRecommendationRequest
from app.ai.context_builder import ContextBuilder
from app.ai.ai_service import AIService
from app.config.settings import settings

router = APIRouter(prefix="/api/ai", tags=["AI"])
_context_builder = ContextBuilder()
_ai_service = AIService(api_key=settings.GEMINI_API_KEY, model_name=settings.GEMINI_MODEL)


@router.post("/recommendation")
async def get_recommendation(req: AIRecommendationRequest) -> dict:
    context = await _context_builder.build(
        question=req.question,
        lat=req.lat,
        lng=req.lng,
    )
    result = await _ai_service.get_recommendation(
        question=req.question,
        context=context,
    )
    return result.model_dump()
