import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger("dhruva.firebase")

# ---------------------------------------------------------------------------
# High-Fidelity In-Memory Mock Firestore for Local Development & Testing
# ---------------------------------------------------------------------------

class MockDocumentSnapshot:
    def __init__(self, doc_id: str, data: Optional[Dict[str, Any]]):
        self.id = doc_id
        self._data = data

    @property
    def exists(self) -> bool:
        return self._data is not None

    def to_dict(self) -> Optional[Dict[str, Any]]:
        if self._data is None:
            return None
        return dict(self._data)


class MockDocumentReference:
    def __init__(self, collection_store: Dict[str, Dict[str, Any]], doc_id: str):
        self._store = collection_store
        self.id = doc_id

    def get(self) -> MockDocumentSnapshot:
        data = self._store.get(self.id)
        return MockDocumentSnapshot(self.id, data)

    def set(self, data: Dict[str, Any], merge: bool = False) -> None:
        data_copy = dict(data)
        if merge and self.id in self._store:
            self._store[self.id].update(data_copy)
        else:
            self._store[self.id] = data_copy

    def update(self, data: Dict[str, Any]) -> None:
        if self.id not in self._store:
            raise KeyError(f"Document {self.id} does not exist.")
        self._store[self.id].update(data)

    def delete(self) -> None:
        self._store.pop(self.id, None)


class MockQuery:
    def __init__(self, collection_store: Dict[str, Dict[str, Any]]):
        self._store = collection_store
        self._filters: List[tuple] = []
        self._order_by_field: Optional[str] = None
        self._order_descending: bool = False
        self._limit_count: Optional[int] = None

    def where(self, field: str, op: str, value: Any) -> "MockQuery":
        new_query = MockQuery(self._store)
        new_query._filters = list(self._filters) + [(field, op, value)]
        new_query._order_by_field = self._order_by_field
        new_query._order_descending = self._order_descending
        new_query._limit_count = self._limit_count
        return new_query

    def order_by(self, field: str, direction: str = "ASCENDING") -> "MockQuery":
        new_query = MockQuery(self._store)
        new_query._filters = list(self._filters)
        new_query._order_by_field = field
        new_query._order_descending = (direction.upper() == "DESCENDING")
        new_query._limit_count = self._limit_count
        return new_query

    def limit(self, count: int) -> "MockQuery":
        new_query = MockQuery(self._store)
        new_query._filters = list(self._filters)
        new_query._order_by_field = self._order_by_field
        new_query._order_descending = self._order_descending
        new_query._limit_count = count
        return new_query

    def stream(self) -> List[MockDocumentSnapshot]:
        results = []
        for doc_id, doc_data in self._store.items():
            matches = True
            for field, op, val in self._filters:
                item_val = doc_data.get(field)
                if op == "==" and item_val != val:
                    matches = False
                    break
                elif op == ">" and not (item_val is not None and item_val > val):
                    matches = False
                    break
                elif op == "<" and not (item_val is not None and item_val < val):
                    matches = False
                    break
                elif op == ">=" and not (item_val is not None and item_val >= val):
                    matches = False
                    break
                elif op == "<=" and not (item_val is not None and item_val <= val):
                    matches = False
                    break
                elif op == "in" and item_val not in val:
                    matches = False
                    break
            if matches:
                results.append(MockDocumentSnapshot(doc_id, doc_data))

        # Order by if specified
        if self._order_by_field:
            def sort_key(snapshot: MockDocumentSnapshot):
                val = snapshot.to_dict().get(self._order_by_field)
                if val is None:
                    return ""
                return str(val)

            results.sort(key=sort_key, reverse=self._order_descending)

        if self._limit_count is not None:
            results = results[:self._limit_count]

        return results


class MockCollectionReference:
    def __init__(self, collection_store: Dict[str, Dict[str, Any]]):
        self._store = collection_store

    def document(self, doc_id: Optional[str] = None) -> MockDocumentReference:
        if not doc_id:
            doc_id = str(uuid.uuid4())
        return MockDocumentReference(self._store, doc_id)

    def add(self, data: Dict[str, Any]) -> tuple:
        doc_id = str(uuid.uuid4())
        doc_ref = self.document(doc_id)
        doc_ref.set(data)
        return datetime.now(timezone.utc), doc_ref

    def where(self, field: str, op: str, value: Any) -> MockQuery:
        query = MockQuery(self._store)
        return query.where(field, op, value)

    def order_by(self, field: str, direction: str = "ASCENDING") -> MockQuery:
        query = MockQuery(self._store)
        return query.order_by(field, direction)

    def limit(self, count: int) -> MockQuery:
        query = MockQuery(self._store)
        return query.limit(count)

    def stream(self) -> List[MockDocumentSnapshot]:
        return MockQuery(self._store).stream()


class MockFirestoreClient:
    """In-memory database adhering to Firestore interface."""
    def __init__(self):
        self._collections: Dict[str, Dict[str, Dict[str, Any]]] = {}

    def collection(self, name: str) -> MockCollectionReference:
        if name not in self._collections:
            self._collections[name] = {}
        return MockCollectionReference(self._collections[name])

    def clear(self):
        self._collections.clear()


# ---------------------------------------------------------------------------
# Firebase Client Initialization
# ---------------------------------------------------------------------------

_db_instance = None

def get_firestore_client():
    global _db_instance
    if _db_instance is not None:
        return _db_instance

    use_mock = settings.USE_MOCK_FIRESTORE
    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    cred_json_str = settings.FIREBASE_CREDENTIALS_JSON
    is_production = (settings.ENVIRONMENT == "production")

    # Attempt to load real production Firebase Admin SDK credentials
    if not use_mock and (cred_json_str or (cred_path and os.path.exists(cred_path))):
        try:
            import json
            import firebase_admin
            from firebase_admin import credentials, firestore

            if not firebase_admin._apps:
                if cred_json_str:
                    # Initialize from raw environment JSON string
                    cert_dict = json.loads(cred_json_str)
                    cred = credentials.Certificate(cert_dict)
                else:
                    # Initialize from filesystem credentials path (e.g. Render Secret File)
                    cred = credentials.Certificate(cred_path)

                firebase_admin.initialize_app(cred, {
                    'projectId': settings.FIREBASE_PROJECT_ID
                })
            _db_instance = firestore.client()
            logger.info("Successfully connected to production Google Cloud Firestore.")
            return _db_instance
        except Exception as e:
            logger.error(f"Failed to initialize production Firebase Admin SDK: {e}")
            if is_production:
                raise RuntimeError(
                    f"CRITICAL: Production deployment failed to initialize Firebase Firestore: {e}. "
                    "Ensure FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH is configured correctly."
                )

    # In production, never silently run in-memory mock storage
    if is_production and not use_mock:
        raise RuntimeError(
            "CRITICAL: Application is set to ENVIRONMENT=production but no Firebase credentials "
            "were supplied. Configure FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH on your host."
        )

    # Fallback to Mock Firestore for development & testing
    logger.info("Using in-memory Mock Firestore for local/testing execution.")
    _db_instance = MockFirestoreClient()
    return _db_instance

def reset_mock_db():
    """Utility for resetting state between test suites."""
    global _db_instance
    if _db_instance is not None and isinstance(_db_instance, MockFirestoreClient):
        _db_instance.clear()
    else:
        _db_instance = MockFirestoreClient()
    return _db_instance
