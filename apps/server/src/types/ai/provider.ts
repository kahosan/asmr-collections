export abstract class AIProvider {
  abstract vectorizeQuery(query: string): Promise<number[] | undefined>;
  abstract vectorizePassage(passage: string): Promise<number[] | undefined>;
}
