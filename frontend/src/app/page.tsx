import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_24%),linear-gradient(160deg,#020617_0%,#0f172a_55%,#111827_100%)] text-slate-50">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-12 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-16">
        <div className="flex flex-col justify-between gap-12">
          <div className="space-y-8">
            <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm tracking-[0.2em] text-orange-200 uppercase">
              Job Search Tracker
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Keep every referral, stage update, and follow-up in one place.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                InterviewFlow keeps the job search from turning into scattered notes and missed
                follow-ups. Add applications, track referrals, save recruiter updates, and come
                back to one dashboard when things move.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/auth"
                className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-slate-950 hover:bg-orange-400"
              >
                Open App
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                View Dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Your workspace",
                value: "One account",
                detail: "Applications, notes, and reminders stay tied to your own login.",
              },
              {
                label: "Pipeline tracking",
                value: "5 stages",
                detail: "From applied to offer or rejection, every step stays visible.",
              },
              {
                label: "Follow-ups",
                value: "Timed reminders",
                detail: "Set a reminder when you apply so you know when to check back in.",
              },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-[26px] border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <p className="text-sm text-slate-300">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[34px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="rounded-[28px] bg-slate-950/80 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-300">
              How It Works
            </p>
            <div className="mt-6 grid gap-4">
              {[
                "Create an account and keep the job search in one place.",
                "Add the company, role, applied date, and referral details.",
                "Move the application as online tests and interviews happen.",
                "Save notes after recruiter calls, rounds, or salary discussions.",
                "Set a follow-up time and pick it up later in the notification feed.",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4 text-slate-200"
                >
                  <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-400 font-semibold text-slate-950">
                    {index + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
