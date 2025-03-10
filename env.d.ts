declare namespace NodeJS {
	interface ProcessEnv {
        DATABASE_URL: string;
        LINE_CHANNEL_ACCESS_TOKEN: string;
        LINE_CHANNEL_SECRET: string;
	}
}
