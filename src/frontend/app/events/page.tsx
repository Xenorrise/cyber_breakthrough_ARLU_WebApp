import { eventApi } from "@/lib/api-client";
import { createEventAction } from "./actions";

export default async function EventsPage() {
  const events = await eventApi.getEvents();

  return (
    <main>
      <h1>Events</h1>

      <form action={createEventAction}>
        <h2>Create event</h2>
        <label>
          Type
          <input
            name="type"
            placeholder="user.registered"
            minLength={1}
            maxLength={100}
            required
          />
        </label>

        <label>
          Payload (JSON)
          <textarea
            name="payload"
            rows={6}
            defaultValue={`{"userId":"123","source":"web"}`}
            required
          />
        </label>

        <button type="submit">Submit</button>
      </form>

      <section>
        <h2>Event list</h2>
        {events.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <strong>{event.type}</strong> |{" "}
                <code>{new Date(event.createdAt).toLocaleString()}</code>
                <pre>{JSON.stringify(event.payload, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
