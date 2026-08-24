"use client";

import { daysAgo, formatDateTime } from "@/lib/format";
import { useRecruitment, useRecruitmentStats } from "@/lib/recruitment-context";
import { isOpenVacancy, nextInterviewAt } from "@/lib/tracker";
import { STAGES } from "@/lib/types";
import { motion } from "framer-motion";
import Link from "next/link";
import { CandidateDrawer } from "./candidate-drawer";
import { Avatar, PositionChip, StageChip } from "./display";
import { OverviewSkeleton } from "./skeletons";
import { PageFade } from "./ui";

export function OverviewPage() {
  const { brand, views, jobs, loading, setSelectedId } = useRecruitment();
  const stats = useRecruitmentStats();
  const upcoming = views
    .map((item) => ({ item, at: nextInterviewAt(item) }))
    .filter((entry): entry is { item: (typeof views)[number]; at: string } => Boolean(entry.at))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .slice(0, 5);
  const recent = views.slice(0, 6);
  const openJobs = jobs.filter((job) => isOpenVacancy(job.status_vacancy)).slice(0, 4);
  const funnelMax = Math.max(
    ...STAGES.map(
      (stage) => views.filter((item) => item.stage === stage.id).length,
    ),
    1,
  );

  if (loading) return <OverviewSkeleton />;

  return (
    <PageFade>
      <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Active candidates", value: stats.totalCandidates, hint: `${stats.activeCount} still in pipeline` },
            { label: "Open vacancies", value: stats.openJobs, hint: `${jobs.length} total roles` },
            { label: "Interviews this week", value: stats.interviewsThisWeek, hint: "Includes trial and user interviews" },
            { label: "Hired this month", value: stats.hiredThisMonth, hint: `${stats.conversion}% conversion` },
          ].map((stat, index) => (
            <motion.article
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-[22px] border border-line bg-paper-raised p-4 sm:p-5"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                {stat.label}
              </p>
              <p className="mt-3 font-display text-3xl sm:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm text-muted">{stat.hint}</p>
            </motion.article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <article className="rounded-[24px] border border-line bg-paper-raised p-4 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-xl sm:text-2xl">Funnel {brand.shortName}</h2>
                <p className="mt-1 text-sm text-muted">
                  Candidate distribution by hiring stage.
                </p>
              </div>
              <Link href={`/${brand.slug}/pipeline`} className="shrink-0 text-sm text-accent">
                Open pipeline
              </Link>
            </div>
            <div className="mt-6 space-y-3">
              {STAGES.map((stage) => {
                const count = views.filter((item) => item.stage === stage.id).length;
                return (
                  <div key={stage.id} className="grid grid-cols-[72px_minmax(0,1fr)_28px] items-center gap-2 sm:grid-cols-[110px_1fr_32px] sm:gap-3">
                    <p className="truncate text-xs text-muted sm:text-sm">{stage.label}</p>
                    <div className="h-2 overflow-hidden rounded-full bg-paper">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / funnelMax) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="h-full rounded-full bg-accent"
                      />
                    </div>
                    <p className="text-right text-sm">{count}</p>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[24px] border border-line bg-paper-raised p-4 sm:p-6">
            <h2 className="font-display text-xl sm:text-2xl">Interview calendar</h2>
            <p className="mt-1 text-sm text-muted">Upcoming slots on the HR calendar.</p>
            <div className="mt-5 space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted">No interviews scheduled this week.</p>
              ) : (
                upcoming.map(({ item, at }) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className="flex w-full flex-col items-start gap-2 rounded-2xl border border-line px-3 py-3 text-left hover:bg-paper sm:flex-row sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.candidate.full_name}</p>
                      <PositionChip title={item.job.title} className="mt-1 max-w-full" />
                    </div>
                    <p className="shrink-0 text-xs text-accent">{formatDateTime(at)}</p>
                  </button>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[24px] border border-line bg-paper-raised p-4 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-xl sm:text-2xl">Recent activity</h2>
              <Link href={`/${brand.slug}/candidates`} className="text-sm text-accent">
                All candidates
              </Link>
            </div>
            <div className="mt-5 divide-y divide-line">
              {recent.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="flex w-full items-center gap-3 py-3 text-left hover:opacity-80"
                >
                  <Avatar name={item.candidate.full_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.candidate.full_name}</p>
                    <p className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted">
                      <PositionChip title={item.job.title} />
                      <span>· {daysAgo(item.updated_at)}</span>
                    </p>
                  </div>
                  <StageChip stage={item.stage} />
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-[24px] border border-line bg-paper-raised p-4 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-xl sm:text-2xl">Open vacancies</h2>
              <Link href={`/${brand.slug}/jobs`} className="text-sm text-accent">
                Manage
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {openJobs.map((job) => {
                const count = views.filter((item) => item.job_id === job.id).length;
                return (
                  <div key={job.id} className="rounded-2xl border border-line p-4">
                    <p className="text-sm font-medium">
                      <PositionChip title={job.title} className="max-w-full" />
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {job.department} · {job.level} · {job.recruiter_pic}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-accent">
                      {count} candidates · {job.headcount_needed} HC · {job.status_vacancy}
                    </p>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      </div>
      <CandidateDrawer />
    </PageFade>
  );
}
