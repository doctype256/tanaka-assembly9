export interface Case {
    id: number;
    title: string;
    quote?: string;
    client_initials?: string;
    location?: string;
    created_at: string;
}
export interface NewCase {
    title: string;
}
