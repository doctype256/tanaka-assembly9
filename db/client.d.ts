import "dotenv/config";
import { Client } from "@libsql/client";
/**
 * db の型: Turso Client
 */
declare let db: Client;
export default db;
