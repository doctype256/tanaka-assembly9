import { NextRequest, NextResponse } from "next/server";
export declare function GET(request: NextRequest): Promise<NextResponse<any>>;
export declare function POST(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    message: string;
}> | NextResponse<{
    error: any;
}>>;
