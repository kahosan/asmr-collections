import { createLink } from '@tanstack/react-router';
import { PaginationContent, PaginationEllipsis, PaginationLink, PaginationNext, PaginationPrevious, Pagination as SPagination } from '../ui/pagination';

const PLink = createLink(PaginationLink);
const PPrevious = createLink(PaginationPrevious);
const PNext = createLink(PaginationNext);

interface PaginationProps {
  total: number
  current: number
  limit: number
}

export default function Pagination({ total, current, limit }: PaginationProps) {
  const pages = [];

  const totalPages = Math.ceil(total / limit);
  // eslint-disable-next-line sukka/unicorn/no-nested-ternary -- 反正没人看到 QwQ
  const startPage = Math.max(2, current > totalPages - 3 ? (current === totalPages ? current - 4 : current > totalPages - 2 ? current - 2 : current - 3) : current - 1);
  const endPage = Math.min(totalPages - 1, (current <= 3) ? startPage + 3 : current + 1);

  for (let i = startPage; i <= endPage; i++)
    pages.push(i);

  if (totalPages <= 1) return null;

  return (
    <SPagination className="mt-4">
      <PaginationContent>
        <PPrevious to="." search={p => ({ ...p, page: Math.max(1, current - 1) })} className="[&_span]:hidden" />
        <PLink isActive={current === 1} to="." search={p => ({ ...p, page: 1 })}>1</PLink>

        {(current > 3 && totalPages > 8) && <PaginationEllipsis />}

        {pages.map(page => (
          <PLink
            key={page}
            isActive={current === page}
            to="."
            search={p => ({ ...p, page })}
          >
            {page}
          </PLink>
        ))}

        {(current < totalPages - 2 && totalPages > 8) && <PaginationEllipsis />}

        {totalPages > 1 && <PLink isActive={current === totalPages} to="." search={p => ({ ...p, page: totalPages })}>{totalPages}</PLink>}
        <PNext to="." search={p => ({ ...p, page: Math.min(totalPages, current + 1) })} className="[&_span]:hidden" />
      </PaginationContent>
    </SPagination>
  );
}
