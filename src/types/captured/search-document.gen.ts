export interface SearchDocument {
    results: Result[];
}

export interface Result {
    excerpt: string;
    value:   Value;
}

export interface Value {
    metadata: Metadata;
    origin:   string;
}

export interface Metadata {
    availability?:          string;
    description?:           string;
    hierarchy?:             string;
    kind?:                  string;
    metadataKind:           string;
    permalink?:             string;
    title?:                 string;
    appointmentDurations?:  unknown[];
    availabilityDates?:     string[];
    deliveryLanguageCodes?: string[];
    descriptions?:          string[];
    endDates?:              string[];
    ids?:                   string[];
    itemTypes?:             string[];
    lastUpdateds?:          string[];
    mediaDurations?:        number[];
    permalinks?:            string[];
    projectIDs?:            string[];
    projectNames?:          string[];
    signupEndDates?:        unknown[];
    signupStartDates?:      unknown[];
    signupURLs?:            unknown[];
    thumbnailLinks?:        string[];
    titles?:                string[];
    sourceURL?:             string;
}
