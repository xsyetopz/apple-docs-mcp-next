export interface SearchStream {
    diff?: Diff;
    kind:  string;
}

export interface Diff {
    append:     string;
    removeLast: number;
}
