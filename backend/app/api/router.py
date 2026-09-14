from fastapi import APIRouter

from backend.app.api.auth import router as auth_router
from backend.app.api.patients import router as patients_router
from backend.app.api.doctors import router as doctors_router
from backend.app.api.hospitals import router as hospitals_router
from backend.app.api.appointments import router as appointments_router
from backend.app.api.verification import router as verification_router
from backend.app.api.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(doctors_router)
api_router.include_router(hospitals_router)
api_router.include_router(appointments_router)
api_router.include_router(verification_router)
api_router.include_router(admin_router)
