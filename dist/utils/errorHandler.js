export class SupastashError extends Error {
    constructor(message, code, meta) {
        super(message);
        this.name = "SupastashError";
        this.code = code;
        this.meta = meta;
    }
}
