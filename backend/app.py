import os
from uuid import UUID

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from postgrest import APIError
from supabase import Client, create_client

load_dotenv()

app = Flask(__name__)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
if not supabase_url or not supabase_key:
    raise RuntimeError("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set")

supabase: Client = create_client(supabase_url, supabase_key)


@app.after_request
def add_cors_headers(response):
    # Public API: allow browser clients from any origin. Credentials are intentionally
    # not enabled because wildcard origins cannot be combined with credentialed CORS.
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Max-Age"] = "86400"
    return response


@app.errorhandler(APIError)
def handle_database_error(error):
    # Keep internal database details out of public responses.
    app.logger.exception("Supabase request failed")
    return jsonify(error="Database request failed"), 500


def valid_uuid(value):
    try:
        return str(UUID(str(value)))
    except (ValueError, TypeError, AttributeError):
        return None


@app.get("/")
def index():
    return jsonify(message="Events API", endpoints=[
        "/api/events", "/api/events/<id>", "/api/registrations",
        "/api/me/registrations?user_id=<uuid>",
        "/api/events/<id>/registrations",
    ])


@app.get("/api/events")
def list_events():
    result = supabase.table("events").select("*").execute()
    return jsonify(result.data)


@app.get("/api/events/<event_id>")
def get_event(event_id):
    event_id = valid_uuid(event_id)
    if not event_id:
        return jsonify(error="Invalid event id"), 400
    result = supabase.table("events").select("*").eq("id", event_id).limit(1).execute()
    if not result.data:
        return jsonify(error="Event not found"), 404
    return jsonify(result.data[0])


@app.post("/api/registrations")
def create_registration():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify(error="Request body must be a JSON object"), 400
    user_id = valid_uuid(body.get("user_id"))
    event_id = valid_uuid(body.get("event_id"))
    if not user_id or not event_id:
        return jsonify(error="user_id and event_id must be valid UUIDs"), 400

    event_result = supabase.table("events").select("id,capacity,status").eq("id", event_id).limit(1).execute()
    if not event_result.data:
        return jsonify(error="Event not found"), 404
    event = event_result.data[0]
    if event.get("status") and str(event["status"]).lower() not in {"open", "active"}:
        return jsonify(error="Event is not open for registration"), 409

    existing = (supabase.table("registrations").select("id")
                .eq("user_id", user_id).eq("event_id", event_id).limit(1).execute())
    if existing.data:
        return jsonify(error="User is already registered for this event"), 409

    capacity = event.get("capacity")
    if capacity is not None:
        registered = supabase.table("registrations").select("id").eq("event_id", event_id).execute()
        if len(registered.data) >= int(capacity):
            return jsonify(error="Event is at capacity"), 409

    try:
        result = supabase.table("registrations").insert({"user_id": user_id, "event_id": event_id}).execute()
    except APIError as error:
        # A unique constraint, if present, safely catches concurrent duplicate posts.
        if getattr(error, "code", None) == "23505":
            return jsonify(error="User is already registered for this event"), 409
        raise
    created = result.data[0] if result.data else {"user_id": user_id, "event_id": event_id}
    return jsonify(created), 201


@app.get("/api/me/registrations")
def my_registrations():
    # Authentication is disabled, so the caller must supply the identity explicitly.
    user_id = valid_uuid(request.args.get("user_id"))
    if not user_id:
        return jsonify(error="Provide a valid user_id query parameter"), 400
    result = (supabase.table("registrations")
              .select("*,events(*)").eq("user_id", user_id).execute())
    return jsonify(result.data)


@app.get("/api/events/<event_id>/registrations")
def event_registrations(event_id):
    # With authentication disabled, organizer ownership cannot be verified; this
    # endpoint is therefore public, as are all other API endpoints.
    event_id = valid_uuid(event_id)
    if not event_id:
        return jsonify(error="Invalid event id"), 400
    exists = supabase.table("events").select("id").eq("id", event_id).limit(1).execute()
    if not exists.data:
        return jsonify(error="Event not found"), 404
    result = (supabase.table("registrations")
              .select("*,users(id,email,role)").eq("event_id", event_id).execute())
    return jsonify(result.data)


if __name__ == "__main__":
    # Local development only; Render serves the app with Gunicorn.
    app.run(debug=False)
