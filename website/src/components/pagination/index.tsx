import { createLink, useSearch } from '@tanstack/react-router';
import { PaginationContent, PaginationEllipsis, PaginationLink, PaginationNext, PaginationPrevious, Pagination as SPagination } from '../ui/pagination';

interface Props {
  total: number
  current: number
}

const PLink = createLink(PaginationLink);
const PPrevious = createLink(PaginationPrevious);
const PNext = createLink(PaginationNext);

export default function Pagination(props: Props) {
  const { total, current } = props;
  const search = useSearch({ from: '/' });

  const pages = [];

  const totalPages = Math.ceil(total / 20);
  // eslint-disable-next-line sukka/unicorn/no-nested-ternary -- 反正没人看到 QwQ
  const startPage = Math.max(2, current > totalPages - 3 ? (current === totalPages ? current - 4 : current > totalPages - 2 ? current - 2 : current - 3) : current - 1);
  const endPage = Math.min(totalPages - 1, (current <= 3) ? startPage + 3 : current + 1);

  for (let i = startPage; i <= endPage; i++)
    pages.push(i);

  return (
    <SPagination>
      <PaginationContent>
        <PPrevious to="/" search={{ ...search, page: Math.max(1, current - 1) }} className="[&_span]:hidden" />
        <PLink isActive={current === 1} to="/" search={{ ...search, page: 1 }}>1</PLink>

        {(current > 3 && totalPages > 8) && <PaginationEllipsis />}

        {pages.map(page => (
          <PLink
            key={page}
            isActive={current === page}
            to="/"
            search={{ ...search, page }}
          >
            {page}
          </PLink>
        ))}

        {(current < totalPages - 2 && totalPages > 8) && <PaginationEllipsis />}

        {totalPages > 1 && <PLink isActive={current === totalPages} to="/" search={{ ...search, page: totalPages }}>{totalPages}</PLink>}
        <PNext to="/" search={{ ...search, page: Math.min(totalPages, current + 1) }} className="[&_span]:hidden" />
      </PaginationContent>
    </SPagination>
  );
}
