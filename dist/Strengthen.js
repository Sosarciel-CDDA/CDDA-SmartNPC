"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CON_SPELL_FLAG = void 0;
exports.buildStrengthen = buildStrengthen;
const SADefine_1 = require("./SADefine");
/**用于必定成功的控制法术的flags */
exports.CON_SPELL_FLAG = [
    "SILENT",
    "NO_HANDS",
    "NO_LEGS",
    "NO_FAIL",
    "NO_EXPLOSION_SFX",
];
/**战术转移 */
const TacticalTransfer = {
    type: "SPELL",
    id: "tactical_transfer",
    description: "传送到视野范围内的另一个位置。",
    name: "战术转移",
    valid_targets: ["ground"],
    effect: "effect_on_condition",
    min_range: 30,
    shape: "blast",
    flags: [...exports.CON_SPELL_FLAG],
    effect_str: "tactical_transfer_eoc",
};
const TacticalTransferEoc = {
    type: "effect_on_condition",
    id: "tactical_transfer_eoc",
    eoc_type: "ACTIVATION",
    effect: [
        { npc_teleport: { global_val: "tactical_transfer_control_cast_loc", } }
    ],
};
const QuickBackRange = 10;
/**快速后退击退子法术 */
const QuickBackEocSubPush = {
    type: "SPELL",
    id: "quick_back_eoc_pushsub",
    description: "快速后退委托击退法术",
    name: "快速后退委托击退法术",
    valid_targets: ["hostile", "ally", "self"],
    effect: "directed_push",
    min_range: QuickBackRange,
    min_damage: 1,
    max_damage: 1,
    shape: "blast",
    flags: [...exports.CON_SPELL_FLAG],
};
/**快速后退移动调整子法术 */
const QuickBackEocSubMovemod = {
    type: "SPELL",
    id: "quick_back_eoc_movemodsub",
    description: "快速后退委托movemod法术",
    name: "快速后退委托movemod法术",
    valid_targets: ["hostile", "ally", "self"],
    effect: "mod_moves",
    min_range: QuickBackRange,
    min_damage: 50,
    max_damage: 50,
    shape: "blast",
    flags: [...exports.CON_SPELL_FLAG],
};
/**快速后退施法委托 */
const QuickBackEoc = SADefine_1.SADef.genActEoc('QuickBack', [
    { npc_location_variable: { context_val: "tmploc" } },
    { u_cast_spell: { id: QuickBackEocSubPush.id }, loc: { context_val: 'tmploc' } },
    { u_cast_spell: { id: QuickBackEocSubMovemod.id }, loc: { context_val: 'tmploc' } }
], { or: ['u_is_character', 'u_is_monster'] });
/**快速后退 */
const QuickBackSub = {
    type: "SPELL",
    id: "quick_back_sub",
    description: "快速后退子法术",
    name: "快速后退子法术",
    valid_targets: ["hostile"],
    effect: "effect_on_condition",
    min_range: QuickBackRange,
    shape: "blast",
    flags: [...exports.CON_SPELL_FLAG, 'RANDOM_TARGET'],
    effect_str: QuickBackEoc.id,
};
/**快速后退 */
const QuickBack = {
    type: "SPELL",
    id: "quick_back",
    description: "快速后退",
    name: "快速后退",
    valid_targets: ["self"],
    effect: "attack",
    shape: "blast",
    flags: [...exports.CON_SPELL_FLAG],
    extra_effects: [{ id: QuickBackSub.id }]
};
//战斗对话
const QuickBackTalkTopic = {
    type: "talk_topic",
    id: ["TALK_COMBAT_COMMANDS"],
    insert_before_standard_exits: true,
    responses: [{
            truefalsetext: {
                condition: { math: ['n_EnableQuickBack', "==", "1"] },
                true: `不要再和怪物保持射击距离了。`,
                false: `和怪物保持射击距离。`,
            },
            effect: { run_eocs: {
                    id: SADefine_1.SADef.genEOCID('QuickBackTopicSwitch'),
                    eoc_type: 'ACTIVATION',
                    effect: [{ math: ['n_EnableQuickBack', "=", "0"] }],
                    false_effect: [{ math: ['n_EnableQuickBack', "=", "1"] }],
                    condition: { math: ['n_EnableQuickBack', "==", "1"] },
                } },
            topic: "TALK_COMBAT_COMMANDS",
        }]
};
/**取消逃跑效果 */
const Courage = {
    type: "effect_type",
    id: SADefine_1.SADef.genEffectID("Courage"),
    name: ["勇气"],
    desc: ["npc不会逃跑"],
    removes_effects: ["npc_run_away"],
};
/**构建强化数据，将指定的战术转移和快速回退相关数据添加到数据管理器中。
 * @param dm - 数据管理器实例，用于添加数据。
 * @returns 无返回值，异步操作完成后数据将被添加。
 */
async function buildStrengthen(dm) {
    const autoback = SADefine_1.SADef.genActEoc('AutoQuickBack', [
        { u_cast_spell: { id: QuickBack.id } },
        //{u_message:"<global_val:tmpstr>"},
        //{u_cast_spell: {id:'fireball',min_level:10}},
    ], { and: ['u_is_npc', { math: ['u_EnableQuickBack', '==', '1'] }] });
    dm.addInvokeID('Update', 0, autoback.id);
    const courageInit = SADefine_1.SADef.genActEoc('InitCourage', [
        { u_add_effect: Courage.id, duration: 'PERMANENT' }
    ]);
    dm.addInvokeID('Init', 0, courageInit.id);
    dm.addData([
        autoback, TacticalTransfer, TacticalTransferEoc,
        QuickBack, QuickBackSub, QuickBackEoc,
        QuickBackEocSubMovemod, QuickBackEocSubPush, QuickBackTalkTopic,
        courageInit, Courage,
    ], 'strength.json');
}
