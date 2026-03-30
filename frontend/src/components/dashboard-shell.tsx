"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { clearSession, getStoredUser, getToken } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { STATUSES, type ApplicationStatus, type JobApplication, type NotificationItem, type User } from "@/lib/types";

type ApplicationFormState = {
  company: string;
  role: string;
  referral: boolean;
  referrerName: string;
  appliedDate: string;
  reminderAt: string;
  initialNote: string;
};

const initialApplicationForm: ApplicationFormState = {
  company: "",
  role: "",
  referral: false,
  referrerName: "",
  appliedDate: new Date().toISOString().slice(0, 10),
  reminderAt: "",
  initialNote: "",
};

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  ONLINE_ASSESSMENT: "Online Assessment",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export function DashboardShell() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [applicationForm, setApplicationForm] = useState(initialApplicationForm);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [pageState, setPageState] = useState<"loading" | "ready">("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionToken = getToken();
    const sessionUser = getStoredUser();

    if (!sessionToken || !sessionUser) {
      router.replace("/auth");
      return;
    }

    setToken(sessionToken);
    setUser(sessionUser);
    void loadDashboard(sessionToken);
  }, [router]);

  async function loadDashboard(sessionToken: string) {
    try {
      const [applicationData, notificationData] = await Promise.all([
        apiRequest<JobApplication[]>("/api/applications", { token: sessionToken }),
        apiRequest<NotificationItem[]>("/api/notifications", { token: sessionToken }),
      ]);

      setApplications(applicationData);
      setNotifications(notificationData);
      setPageState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load dashboard.");
      setPageState("ready");
    }
  }

  async function handleCreateApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const created = await apiRequest<JobApplication>("/api/applications", {
        method: "POST",
        token,
        body: {
          company: applicationForm.company,
          role: applicationForm.role,
          referral: applicationForm.referral,
          referrerName: applicationForm.referral ? applicationForm.referrerName : null,
          appliedDate: applicationForm.appliedDate,
          reminderAt: applicationForm.reminderAt
            ? new Date(applicationForm.reminderAt).toISOString()
            : null,
          initialNote: applicationForm.initialNote || null,
        },
      });

      setApplications((current) => [created, ...current]);
      setApplicationForm(initialApplicationForm);

      startTransition(() => {
        void refreshNotifications(token);
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create application.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(applicationId: string, status: ApplicationStatus) {
    if (!token) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const updated = await apiRequest<JobApplication>(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });

      replaceApplication(updated);
      startTransition(() => {
        void refreshNotifications(token);
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update stage.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddNote(applicationId: string) {
    if (!token) {
      return;
    }

    const content = noteDrafts[applicationId]?.trim();
    if (!content) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const updated = await apiRequest<JobApplication>(`/api/applications/${applicationId}/notes`, {
        method: "POST",
        token,
        body: { content },
      });

      replaceApplication(updated);
      setNoteDrafts((current) => ({ ...current, [applicationId]: "" }));

      startTransition(() => {
        void refreshNotifications(token);
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add note.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshNotifications(sessionToken: string) {
    const notificationData = await apiRequest<NotificationItem[]>("/api/notifications", {
      token: sessionToken,
    });
    setNotifications(notificationData);
  }

  function replaceApplication(updated: JobApplication) {
    setApplications((current) =>
      current
        .map((application) => (application.id === updated.id ? updated : application))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  }

  function signOut() {
    clearSession();
    router.replace("/auth");
  }

  if (pageState === "loading") {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-6xl rounded-[30px] bg-white p-10 shadow-sm">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-6 py-8 text-slate-950 lg:px-10">
      <section className="mx-auto grid max-w-7xl gap-6">
        <div className="rounded-[30px] bg-slate-950 px-6 py-6 text-slate-50 shadow-[0_20px_70px_rgba(15,23,42,0.18)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-300">InterviewFlow</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Hiring pipeline dashboard</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Welcome back{user ? `, ${user.name}` : ""}. Add applications, keep recruiter notes,
                move stages, and stay on top of follow-ups from one place.
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr_0.8fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-600">
                New application
              </p>
              <h2 className="mt-3 text-2xl font-semibold">Capture the opportunity while it is fresh</h2>
            </div>

            <form onSubmit={handleCreateApplication} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm text-slate-700">
                Company
                <input
                  required
                  value={applicationForm.company}
                  onChange={(event) =>
                    setApplicationForm((current) => ({ ...current, company: event.target.value }))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-700">
                Role
                <input
                  required
                  value={applicationForm.role}
                  onChange={(event) =>
                    setApplicationForm((current) => ({ ...current, role: event.target.value }))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-700">
                Applied date
                <input
                  required
                  type="date"
                  value={applicationForm.appliedDate}
                  onChange={(event) =>
                    setApplicationForm((current) => ({ ...current, appliedDate: event.target.value }))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={applicationForm.referral}
                  onChange={(event) =>
                    setApplicationForm((current) => ({ ...current, referral: event.target.checked }))
                  }
                />
                This application came through a referral
              </label>

              {applicationForm.referral ? (
                <label className="grid gap-2 text-sm text-slate-700">
                  Referrer name
                  <input
                    value={applicationForm.referrerName}
                    onChange={(event) =>
                      setApplicationForm((current) => ({ ...current, referrerName: event.target.value }))
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400"
                  />
                </label>
              ) : null}

              <label className="grid gap-2 text-sm text-slate-700">
                Reminder time
                <input
                  type="datetime-local"
                  value={applicationForm.reminderAt}
                  onChange={(event) =>
                    setApplicationForm((current) => ({ ...current, reminderAt: event.target.value }))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-700">
                First note
                <textarea
                  rows={4}
                  value={applicationForm.initialNote}
                  onChange={(event) =>
                    setApplicationForm((current) => ({ ...current, initialNote: event.target.value }))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400"
                  placeholder="HR said they will get back after the weekend..."
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className="rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-slate-950 hover:bg-orange-400 disabled:opacity-60"
              >
                Add application
              </button>
            </form>

            <p className="mt-4 min-h-6 text-sm text-rose-600">{message}</p>
          </section>

          <section className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Active applications</p>
                <p className="mt-2 text-3xl font-semibold">{applications.length}</p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Referrals tagged</p>
                <p className="mt-2 text-3xl font-semibold">
                  {applications.filter((item) => item.referral).length}
                </p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Unread alerts</p>
                <p className="mt-2 text-3xl font-semibold">{notifications.length}</p>
              </article>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {STATUSES.map((status) => (
                <section
                  key={status}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold">{statusLabels[status]}</h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {applications.filter((item) => item.status === status).length}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4">
                    {applications
                      .filter((item) => item.status === status)
                      .map((application) => (
                        <article
                          key={application.id}
                          className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold">{application.company}</h3>
                              <p className="text-sm text-slate-600">{application.role}</p>
                            </div>
                            <select
                              value={application.status}
                              onChange={(event) =>
                                handleStatusChange(
                                  application.id,
                                  event.target.value as ApplicationStatus,
                                )
                              }
                              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                              {STATUSES.map((item) => (
                                <option key={item} value={item}>
                                  {statusLabels[item]}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="mt-4 grid gap-2 text-sm text-slate-600">
                            <p>Applied on {formatDate(application.appliedDate)}</p>
                            {application.referral ? (
                              <p>Referral from {application.referrerName || "Unknown contact"}</p>
                            ) : (
                              <p>Direct application</p>
                            )}
                            {application.reminderAt ? (
                              <p>Reminder at {formatDateTime(application.reminderAt)}</p>
                            ) : null}
                          </div>

                          <div className="mt-4 grid gap-2">
                            {application.notes.slice(0, 2).map((note) => (
                              <div
                                key={note.id}
                                className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-700"
                              >
                                {note.content}
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 grid gap-2">
                            <textarea
                              rows={3}
                              value={noteDrafts[application.id] ?? ""}
                              onChange={(event) =>
                                setNoteDrafts((current) => ({
                                  ...current,
                                  [application.id]: event.target.value,
                                }))
                              }
                              placeholder="Add a note after a recruiter call or round update..."
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddNote(application.id)}
                              disabled={busy}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold hover:border-orange-300 hover:text-orange-700 disabled:opacity-60"
                            >
                              Save note
                            </button>
                          </div>
                        </article>
                      ))}

                    {applications.every((item) => item.status !== status) ? (
                      <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                        Nothing in {statusLabels[status].toLowerCase()} yet.
                      </div>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-600">
                  Notifications
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Reminder and activity feed</h2>
              </div>
              {token ? (
                <button
                  type="button"
                  onClick={() => void refreshNotifications(token)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-orange-300 hover:text-orange-700"
                >
                  Refresh
                </button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{notification.title}</h3>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                      {notification.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </article>
              ))}

              {notifications.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  Notifications will appear here when reminders or activity updates arrive.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
