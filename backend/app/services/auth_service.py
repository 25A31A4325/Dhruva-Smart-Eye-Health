import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.core.firebase import get_firestore_client
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import UserCreate, UserLogin, UserResponse, UserPreferences, UserUpdatePreferences, TokenResponse

class AuthService:
    def __init__(self):
        self.collection_name = "users"

    @property
    def db(self):
        return get_firestore_client()

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        query = self.db.collection(self.collection_name).where("email", "==", email.lower().strip()).limit(1)
        results = query.stream()
        for doc in results:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        doc_ref = self.db.collection(self.collection_name).document(user_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None

    def register_user(self, user_in: UserCreate) -> TokenResponse:
        existing = self.get_user_by_email(user_in.email)
        if existing:
            raise ValueError("A user with this email address is already registered.")

        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_in.password)
        now_iso = datetime.now(timezone.utc).isoformat()
        
        pref_dict = user_in.preferences.model_dump() if user_in.preferences else UserPreferences().model_dump()

        user_doc = {
            "email": user_in.email.lower().strip(),
            "hashed_password": hashed_password,
            "full_name": user_in.full_name.strip(),
            "preferences": pref_dict,
            "created_at": now_iso,
            "updated_at": now_iso
        }

        self.db.collection(self.collection_name).document(user_id).set(user_doc)

        user_response = UserResponse(
            id=user_id,
            email=user_doc["email"],
            full_name=user_doc["full_name"],
            preferences=UserPreferences(**pref_dict),
            created_at=now_iso
        )

        access_token = create_access_token(subject=user_id)
        return TokenResponse(access_token=access_token, user=user_response)

    def login_user(self, login_in: UserLogin) -> TokenResponse:
        user = self.get_user_by_email(login_in.email)
        if not user:
            raise ValueError("Invalid email or password.")

        if not verify_password(login_in.password, user.get("hashed_password", "")):
            raise ValueError("Invalid email or password.")

        user_response = UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            preferences=UserPreferences(**user.get("preferences", UserPreferences().model_dump())),
            created_at=user.get("created_at", datetime.now(timezone.utc).isoformat())
        )

        access_token = create_access_token(subject=user["id"])
        return TokenResponse(access_token=access_token, user=user_response)

    def update_preferences(self, user_id: str, updates: UserUpdatePreferences) -> UserPreferences:
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found.")

        current_prefs = user.get("preferences", UserPreferences().model_dump())
        update_data = updates.model_dump(exclude_unset=True)
        current_prefs.update(update_data)

        self.db.collection(self.collection_name).document(user_id).update({
            "preferences": current_prefs,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

        return UserPreferences(**current_prefs)

auth_service = AuthService()
