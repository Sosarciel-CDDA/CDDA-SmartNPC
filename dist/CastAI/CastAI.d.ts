import { DataManager } from "cdda-event";
import { CastAIDataTable } from "./CastAIInterface";
/**施法AI数据 */
export declare const CastAIDataMap: CastAIDataTable;
/**处理角色技能 */
export declare function createCastAI(dm: DataManager): Promise<void>;
