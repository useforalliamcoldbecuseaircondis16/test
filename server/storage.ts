import { users, logs, configurations, type User, type InsertUser, type Log, type InsertLog, type Config, type InsertConfig } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Logs methods
  getLogs(): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  clearLogs(): Promise<void>;
  
  // Configuration methods
  getConfig(): Promise<Config>;
  updateConfig(config: InsertConfig): Promise<Config>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private logs: Map<number, Log>;
  private config: Config;
  private currentUserId: number;
  private currentLogId: number;

  constructor() {
    this.users = new Map();
    this.logs = new Map();
    this.currentUserId = 1;
    this.currentLogId = 1;
    
    // Default configuration
    this.config = {
      id: 1,
      targetUrl: "http://bnsmb.de/files/public/Android/archive/scripts/",
      corsEnabled: true,
      autoExecute: true,
      customHeaders: "[]",
      customScript: "",
      createdAt: new Date()
    };
    
    // Add initial logs
    this.createLog({ level: "info", message: "Express server started on port 5000" });
    this.createLog({ level: "info", message: "CORS middleware initialized" });
    this.createLog({ level: "success", message: "Content-Disposition headers configured" });
    this.createLog({ level: "info", message: "System ready for website embedding and automation" });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLogs(): Promise<Log[]> {
    return Array.from(this.logs.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.currentLogId++;
    const log: Log = { 
      ...insertLog, 
      id, 
      timestamp: new Date() 
    };
    this.logs.set(id, log);
    return log;
  }

  async clearLogs(): Promise<void> {
    this.logs.clear();
    this.currentLogId = 1;
  }

  async getConfig(): Promise<Config> {
    return this.config;
  }

  async updateConfig(configData: InsertConfig): Promise<Config> {
    this.config = {
      ...this.config,
      ...configData,
      createdAt: new Date()
    };
    return this.config;
  }
}

export const storage = new MemStorage();
