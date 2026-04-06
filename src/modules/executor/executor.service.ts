import { StructuredQuery } from "../query/query.schemas";
import { InvoiceRow } from "../query/query.types";

export class ExecutorService {
  static execute(rows: InvoiceRow[], query: StructuredQuery) {
    let result = [...rows];

    if (query.filters?.length) {  // applying filters using the javascript array filters
      result = result.filter((row) =>
        query.filters!.every((filter) => {
          const fieldValue = row[filter.field];
          const filterValue = filter.value;

          switch (filter.operator) {
            case "eq":
              return fieldValue === filterValue;

            case "neq":
              return fieldValue !== filterValue;

            case "gt":
              return (
                typeof fieldValue === "number" &&
                typeof filterValue === "number" &&
                fieldValue > filterValue
              );

            case "gte":
              return (
                typeof fieldValue === "number" &&
                typeof filterValue === "number" &&
                fieldValue >= filterValue
              );

            case "lt":
              return (
                typeof fieldValue === "number" &&
                typeof filterValue === "number" &&
                fieldValue < filterValue
              );

            case "lte":
              return (
                typeof fieldValue === "number" &&
                typeof filterValue === "number" &&
                fieldValue <= filterValue
              );
            case "contains":
              return (
                typeof fieldValue === "string" &&
                typeof filterValue === "string" &&
                fieldValue.toLowerCase().includes(filterValue.toLowerCase())
              );

            default:
              return false;
          }
        }),
      );
    }

    if (query.sort) { // applying sorting using the javascript array sort
      const { field, direction } = query.sort;

      result.sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];

        if (typeof aValue === "number" && typeof bValue === "number") {
          return direction === "asc" ? aValue - bValue : bValue - aValue;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return 0;
      });
    }

    if (query.limit) {
      result = result.slice(0, query.limit);
    }

    if (query.select?.length) {
      const selectedFields = query.select;

      return result.map((row) => {
        const projectedRow = {} as Record<string, string | number>;

        for (const field of selectedFields) {
          projectedRow[field] = row[field];
        }

        return projectedRow;
      });
    }

    return result;
  }
}
