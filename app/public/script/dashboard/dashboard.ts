import renderCharts from "./renderCharts.js";
import { initFadeEffect } from "../animateUtils.js";

export interface UserStats {
    totalGames: number;
    winRate: number;
    currentWinStreak: number;
    longestWinStreak: number;
    totalGoalsScored: number;
    gamesPerDay: { [date: string]: number };
    winRateOverTime: { date: string; winRate: number }[];
}

interface GameStats {
    opponent: string;
    date: string;
    winner: boolean;
    currScore: number;
    oppScore: number;
    mode?: string;
    match_duration: number;
}

interface AllStats {
    gameStats: GameStats[];
    userStats: UserStats;
}

export default class DashboardManager {
    private gameStatsBtn;
    private dashboardBtn;
    private userDashboardElem;
    private gameStatsElem;
    private currentView;
    private userStats: UserStats | null;
    private gameStats: GameStats[] | null;

    constructor() {
        this.userStats = null;
        this.gameStats = null;
        this.gameStatsBtn = document.getElementById("game-stats-btn");
        this.dashboardBtn = document.getElementById("dashboard-btn");
        this.userDashboardElem = document.getElementById("user-dashboard");
        this.gameStatsElem = document.getElementById("game-stats");
        this.currentView = "user-dashboard";
        this.displayDashboard();
    }

    private async fetchStats(): Promise<AllStats | null> {
        try {
            const res = await fetch("/api/dashboard/stats");
            const data = await res.json();
            if (res.status === 500 || data.message) {
                return (null);
            }
            return (data);
        } catch (err) {
            console.error("Failed to fetch or parse JSON:", err);
            return (null);
        }
    }

    private async getStats() {
        const allStats: AllStats | null = await this.fetchStats();
        if (!allStats || !allStats.userStats || !allStats.userStats) {
            this.userStats = {
                totalGames: 0,
                winRate: 0,
                currentWinStreak: 0,
                longestWinStreak: 0,
                totalGoalsScored: 0,
                gamesPerDay: { "": 0 },
                winRateOverTime: [{
                    date: "",
                    winRate: 0,
                }],
            }
            this.gameStats = [];
        }
        else {
            this.userStats = allStats.userStats;
            this.gameStats = allStats.gameStats;
        }
    }

    private displaySimpleStats() {
        const gamesPlayed = document.getElementById("games-played");
        const currWinStreak = document.getElementById("current-streak");
        const longestWinStreak = document.getElementById("longest-streak");
        if (!gamesPlayed || !currWinStreak || !longestWinStreak) return;
        gamesPlayed.textContent = this.userStats!.totalGames.toString();
        currWinStreak.textContent = this.userStats!.currentWinStreak.toString();
        longestWinStreak.textContent = `Longest win streak: ${this.userStats!.longestWinStreak.toString()}`;
    }

    private renderGameStats() {
        const entriesContainer = document.getElementById("game-stats-entries");
        if (!entriesContainer || !this.gameStats) return;
        if (this.gameStats.length === 0)
            entriesContainer.innerHTML = entriesContainer.innerHTML + `<div class="dashboard-tab-line bg-white rounded-xl m-1 flex items-center justify-center">-</div>`;
        for (const game of this.gameStats!) {
            const entry = `
        <div class="dashboard-tab-line bg-white rounded-xl m-1">
            <span class="dashboard-entry">${game.opponent}</span>
            <span class="dashboard-entry">${game.date}</span>
            <span class="dashboard-entry">${game.mode}</span>
            <span class="dashboard-entry">${game.winner ? "Victory" : "Defeat"}</span>
            <span class="dashboard-entry">${game.currScore + " - " + game.oppScore}</span>
            <span class="dashboard-entry">${game.match_duration + "s"} </span>
        </div>`;
            entriesContainer.innerHTML = entriesContainer.innerHTML + entry;
        }
    }

    private initBtn(view: string, selectedbtn: HTMLElement, unselectedbtn: HTMLElement) {
        const changeView = async () => {
            if (this.currentView === view) return;
            this.currentView = view;
            unselectedbtn.classList.remove("selected-button-style");
            selectedbtn.classList.add("selected-button-style");
            unselectedbtn.classList.add("button-style");
            selectedbtn.classList.remove("button-style");
            if (view === "user-dashboard") {
                this.gameStatsElem!.classList.add("hidden");
                this.userDashboardElem!.classList.remove("hidden");
            } else {
                this.userDashboardElem!.classList.add("hidden");
                this.gameStatsElem!.classList.remove("hidden");
            }
        };
        selectedbtn.removeEventListener("click", changeView);
        selectedbtn.addEventListener("click", changeView);
    }

    private async initListeners() {
        this.initBtn("game-stats", this.gameStatsBtn!, this.dashboardBtn!);
        this.initBtn("user-dashboard", this.dashboardBtn!, this.gameStatsBtn!);
        initFadeEffect("stats-scroll", "stats-wrapper");
    }

    async displayDashboard() {
        await this.getStats();
        this.initListeners();
        this.displaySimpleStats();
        this.renderGameStats();
        renderCharts(this.userStats!);
    }
}
