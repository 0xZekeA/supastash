export interface NetworkAdapter {
  subscribe(cb: (online: boolean) => void): () => void;
  getStatus(): Promise<boolean>;
}

export interface CryptoAdapter {
  sha256(input: string): Promise<string>;
}
