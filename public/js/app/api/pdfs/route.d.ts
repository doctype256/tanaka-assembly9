import { NextResponse } from 'next/server';
export declare function GET(): Promise<NextResponse<{
    id: string;
    title: string;
    url: string;
}[]> | NextResponse<{
    error: string;
}>>;
export declare function POST(request: any): Promise<NextResponse<any>>;
export declare function DELETE(request: any): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    success: boolean;
    message: string;
}>>;
