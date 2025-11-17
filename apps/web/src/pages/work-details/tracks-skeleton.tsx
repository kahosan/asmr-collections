import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import { Skeleton } from '~/components/ui/skeleton';

export default function TracksSkeleton() {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-4" />
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-15" />
      </div>

      <div className="mt-4 border rounded-md">
        <Table className="table-fixed">
          <TableBody>
            {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map(key => (
              <TableRow key={key}>
                <TableCell className="p-0">
                  <div className="flex gap-3 items-center p-3">
                    <Skeleton className="min-w-6 h-6 w-6 rounded" />
                    <Skeleton className="h-5 flex-1" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
