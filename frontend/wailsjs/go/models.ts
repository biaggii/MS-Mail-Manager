export namespace main {
	
	export class Account {
	    id: string;
	    label: string;
	    email: string;
	    clientID: string;
	    refreshToken: string;
	    mailbox: string;
	    socks5: string;
	    httpProxy: string;
	
	    static createFrom(source: any = {}) {
	        return new Account(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.email = source["email"];
	        this.clientID = source["clientID"];
	        this.refreshToken = source["refreshToken"];
	        this.mailbox = source["mailbox"];
	        this.socks5 = source["socks5"];
	        this.httpProxy = source["httpProxy"];
	    }
	}
	export class AccountInput {
	    id: string;
	    label: string;
	    email: string;
	    clientID: string;
	    refreshToken: string;
	    mailbox: string;
	    socks5: string;
	    httpProxy: string;
	
	    static createFrom(source: any = {}) {
	        return new AccountInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.email = source["email"];
	        this.clientID = source["clientID"];
	        this.refreshToken = source["refreshToken"];
	        this.mailbox = source["mailbox"];
	        this.socks5 = source["socks5"];
	        this.httpProxy = source["httpProxy"];
	    }
	}
	export class ActionResult {
	    action: string;
	    url: string;
	    statusCode: number;
	    body: string;
	
	    static createFrom(source: any = {}) {
	        return new ActionResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.action = source["action"];
	        this.url = source["url"];
	        this.statusCode = source["statusCode"];
	        this.body = source["body"];
	    }
	}
	export class AppState {
	    apiBaseURL: string;
	    accounts: Account[];
	
	    static createFrom(source: any = {}) {
	        return new AppState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.apiBaseURL = source["apiBaseURL"];
	        this.accounts = this.convertValues(source["accounts"], Account);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ImportResult {
	    state: AppState;
	    imported: number;
	    failed: number;
	    errors: string[];
	
	    static createFrom(source: any = {}) {
	        return new ImportResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.state = this.convertValues(source["state"], AppState);
	        this.imported = source["imported"];
	        this.failed = source["failed"];
	        this.errors = source["errors"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UIMailItem {
	    email: string;
	    password: string;
	    client_id: string;
	    refresh_token: string;
	    tab: string;
	    remark: string;
	    tags: string[];
	
	    static createFrom(source: any = {}) {
	        return new UIMailItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.email = source["email"];
	        this.password = source["password"];
	        this.client_id = source["client_id"];
	        this.refresh_token = source["refresh_token"];
	        this.tab = source["tab"];
	        this.remark = source["remark"];
	        this.tags = source["tags"];
	    }
	}
	export class UIPost {
	    send: string;
	    subject: string;
	    text: string;
	    html: string;
	    date: string;
	
	    static createFrom(source: any = {}) {
	        return new UIPost(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.send = source["send"];
	        this.subject = source["subject"];
	        this.text = source["text"];
	        this.html = source["html"];
	        this.date = source["date"];
	    }
	}
	export class UIState {
	    lang: string;
	    splitSymbol: string;
	    tabs: string[];
	    activeTab: string;
	    pageSize: number;
	    mailList: UIMailItem[];
	    mailCache: Record<string, Array<UIPost>>;
	
	    static createFrom(source: any = {}) {
	        return new UIState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.lang = source["lang"];
	        this.splitSymbol = source["splitSymbol"];
	        this.tabs = source["tabs"];
	        this.activeTab = source["activeTab"];
	        this.pageSize = source["pageSize"];
	        this.mailList = this.convertValues(source["mailList"], UIMailItem);
	        this.mailCache = this.convertValues(source["mailCache"], Array<UIPost>, true);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

