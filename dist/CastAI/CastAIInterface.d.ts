import { CharHook } from "cdda-event";
import { BoolObj, EocEffect, NumObj, SpellID } from "cdda-schema";
import { DefCastData } from "./DefData";
/**技能选择目标类型 列表 */
export declare const TargetTypeList: readonly ["auto", "random", "direct_hit", "filter_random", "control_cast"];
/**技能选择目标类型
 * auto 为 根据施法目标自动选择;
 *
 * random 为 原版随机 适用于自身buff;
 *
 * direct_hit 为 直接命中交互单位 适用于任何目标技能
 * hook 必须为互动事件
 *
 * filter_random 为根据条件筛选可能的目标 命中第一个通过筛选的目标 条件中u为施法者n为目标 适用于队友buff;
 *
 * control_cast 为玩家控制施法 u 为玩家 n 为npc hook字段无效 `${spell.id}_loc` 为玩家选择坐标
 *
 * 默认为auto
 * 若允许多个cast_condition 请指定具体type
 * 相同的hook与target(包括auto或未指定)将覆盖
 */
export type TargetType = typeof TargetTypeList[number];
/**数据表 技能ID : 施法数据
 * @additionalProperties {"$ref": "#/definitions/RawCastAIData"}
*/
export type CastAIDataTable = Partial<Record<SpellID, RawCastAIData>>;
/**施法数据 */
export type CastAIData = {
    /**目标法术ID 默认为键值 */
    id?: SpellID;
    /**技能的释放条件 */
    cast_condition: CastCond | CastCond[];
    /**权重 优先尝试触发高权重的spell 取值范围 -99 ~ 99 默认0 */
    weight?: number;
    /**概率 有1/chance的几率使用这个技能 默认1 */
    one_in_chance?: number;
    /**冷却时间 单位为每次CharUpdate 默认0 */
    cooldown?: number;
    /**共同冷却时间 影响所有技能的释放 单位为每次CharUpdate 默认1
     * 一个高权重0共同冷却的技能意味着可以同时触发
     */
    common_cooldown?: number;
    /**释放成功后运行的效果 */
    after_effect?: EocEffect[];
    /**尝试释放时就运行的效果 */
    before_effect?: EocEffect[];
};
/**未处理的施法数据 */
export type RawCastAIData = CastAIData | DefCastData;
/**技能的释放条件 */
export type CastCond = {
    /**唯一id 默认为下标 */
    id?: string;
    /**释放条件 */
    condition?: (BoolObj);
    /**时机 */
    hook: CharHook;
    /**瞄准方式
     * auto 为 根据施法目标自动选择;
     *
     * random 为 原版随机 适用于自身buff;
     *
     * direct_hit 为 直接命中交互单位 适用于任何目标技能
     * hook 必须为互动事件 "CharTakeDamage CharTakeRangeDamage CharTakeMeleeDamage CharSucessMeleeAttack CharCauseRangeHit CharCauseHit";
     *
     * filter_random 为根据条件筛选可能的目标 命中第一个通过筛选的目标 条件中u为施法者n为目标 适用于队友buff;
     *
     * control_cast 为玩家控制施法 u 为玩家 n 为npc hook字段无效 `${spell.id}_loc` 为玩家选择坐标
     *
     * 默认为auto
     */
    target?: TargetType;
    /**释放成功后运行的效果 */
    after_effect?: EocEffect[];
    /**尝试释放时就运行的效果 */
    before_effect?: EocEffect[];
    /**忽略能量消耗 */
    ignore_cost?: boolean;
    /**强制使用某个法术等级 */
    force_lvl?: NumObj;
    /**此条件的独立权重 取值范围 -99 ~ 99 默认0 */
    weight?: number;
};
/**基础技能数据 */
export type CastProcData = Readonly<{
    /**技能 */
    skill: CastAIData;
    /**基础释放eoc条件 */
    base_cond: (BoolObj)[];
    /**基础成功eoc效果 */
    true_effect: EocEffect[];
    /**基础准备释放Eoc */
    pre_effect: EocEffect[];
    /**释放条件 */
    cast_condition: CastCond;
    /**施法等级 */
    min_level: NumObj;
}>;
