export abstract class AIProvider {
  abstract vectorizeQuery(query: string): Promise<number[] | undefined>;
  abstract vectorizePassage(passage: string): Promise<number[] | undefined>;
  abstract rerank<T>(query: string, documents: string[], items: T[]): Promise<T[]>;
}
