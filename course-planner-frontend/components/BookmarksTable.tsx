"use client";

import { CourseOffering, Bookmark, Course } from "@/lib/api";

interface BookmarksTableProps {
  offerings: CourseOffering[];
  bookmarks: Bookmark[];
  courses: Map<number, Course>; // ← courseId → Course
  onDelete: (bookmarkId: number) => void;
  onRowClick: (offering: CourseOffering, bookmark: Bookmark) => void;
}

export default function BookmarksTable({
  offerings,
  bookmarks,
  courses, // ← Get course lookup
  onDelete,
  onRowClick,
}: BookmarksTableProps) {
  // Get bookmark for this offering
  const getBookmark = (offering: CourseOffering): Bookmark | null => {
    return bookmarks.find((b) => b.semesterCode === offering.semesterCode && b.section === offering.section) ?? null;
  };

  // Get course info for this offering
  const getCourseInfo = (bookmark: Bookmark) => {
    const course = courses.get(bookmark.courseId);
    if (!course) return null;

    return {
      deptCode: course.deptId, // We need to get deptCode somehow...
      courseNumber: course.courseNumber,
      title: course.title,
    };
  };

  return (
    <div className="light-card dark:dark-card overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th className="table-header text-left">Course</th> {/* NEW */}
              <th className="table-header text-left">Section</th>
              <th className="table-header text-left">Term</th>
              <th className="table-header text-left">Campus</th>
              <th className="table-header text-left">Instructor</th>
              <th className="table-header text-right">Enrolled</th>
              <th className="table-header text-right">Capacity</th>
              <th className="table-header text-right">Load</th>
              <th className="table-header text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offerings.map((offering) => {
              const bookmark = getBookmark(offering);
              if (!bookmark) return null;

              const courseInfo = getCourseInfo(bookmark);
              const bookmarkId = bookmark.bookmarkId;

              return (
                <tr
                  key={`${offering.semesterCode}-${offering.section}`}
                  className="table-row group"
                  onClick={() => onRowClick(offering, bookmark)}
                >
                  {/* Course Info Column */}
                  <td className="table-cell">
                    {courseInfo ? (
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{courseInfo.courseNumber}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                          {courseInfo.title}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Loading...</span>
                    )}
                  </td>

                  {/* Section */}
                  <td className="table-cell">
                    <span className="font-semibold text-gray-900 dark:text-white">{offering.section}</span>
                  </td>

                  {/* Term */}
                  <td className="table-cell">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {offering.term} {offering.year}
                      </div>
                      {offering.isEnrolling && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                          Enrolling Now
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Campus */}
                  <td className="table-cell">
                    <span className="text-gray-700 dark:text-gray-300">{offering.location}</span>
                  </td>

                  {/* Instructor */}
                  <td className="table-cell">
                    <span className="text-gray-700 dark:text-gray-300">{offering.instructors || "TBA"}</span>
                  </td>

                  {/* Enrolled */}
                  <td className="table-cell text-right">
                    <span className="text-gray-900 dark:text-white font-medium">{offering.enrolled}</span>
                  </td>

                  {/* Capacity */}
                  <td className="table-cell text-right">
                    <span className="text-gray-700 dark:text-gray-300">{offering.capacity}</span>
                  </td>

                  {/* Load */}
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            offering.loadPercent >= 95
                              ? "bg-red-500"
                              : offering.loadPercent >= 80
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(offering.loadPercent, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                        {offering.loadPercent}%
                      </span>
                    </div>
                  </td>

                  {/* Delete Button */}
                  <td className="table-cell text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(bookmarkId);
                      }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      title="Remove bookmark"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards - Similar updates */}
      {/* ... (abbreviated for space) */}

      {/* Summary Footer */}
      <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4 bg-gray-50 dark:bg-slate-800/50">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <strong className="text-gray-900 dark:text-white">{offerings.length}</strong> bookmarked{" "}
          {offerings.length === 1 ? "section" : "sections"}
        </div>
      </div>
    </div>
  );
}
