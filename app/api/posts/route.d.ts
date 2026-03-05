import { NextResponse } from 'next/server';
export declare function GET(): Promise<NextResponse<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
}[]>>;
export declare function POST(request: Request): Promise<NextResponse<any>>;
export declare function DELETE(): Promise<NextResponse<{
    success: boolean;
}>>;
