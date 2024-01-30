import { JObject, UtilFT, UtilFunc } from "@zwa73/utils";
import { DATA_PATH, MAX_NUM, SADef, getSpellByID } from "@src/SADefine";
import { Spell, SpellEnergySource, BoolObj, EocEffect, SpellID} from "cdda-schema";
import { SPELL_CT_MODMOVE, SPELL_CT_MODMOVE_VAR } from "@src/UtilSpell";
import { DataManager } from "cdda-event";
import { getDisableSpellVar, parseSpellNumObj } from "./CastAIGener";
import { AIData, AIDataTable, CastProcData } from "./CastAIInterface";
import { procSpellTarget } from "./ProcFunc";
import * as path from 'path';



//全局冷却字段名
const gcdValName = `u_coCooldown`;

//法术消耗变量类型映射
const COST_MAP:Record<SpellEnergySource,string|undefined>={
    "BIONIC" : "u_val('power')",
    "HP"     : "u_hp('torso')",
    "MANA"   : "u_val('mana')",
    "STAMINA": "u_val('stamina')",
    "NONE"   : undefined,
}

/**处理角色技能 */
export async function createCastAI(dm:DataManager){
    const out:JObject[] = [];

    //载入数据
    const aiDataTable:AIDataTable = {};
    const tableList = UtilFT.fileSearchGlob(path.join(DATA_PATH,"CastAI","**","*.json"));
    tableList.forEach((file)=>{
        const json = UtilFT.loadJSONFileSync(file) as AIDataTable;
        Object.entries(json).forEach(([k,v])=>aiDataTable[k as SpellID]=v)
    });

    //权重排序
    const skills = (Object.values(aiDataTable) as AIData[])
        .sort((a,b)=>(b.weight??0)-(a.weight??0));

    //全局冷却事件
    const GCDEoc = SADef.genActEoc(`CoCooldown`,
        [{math:[gcdValName,"-=","1"]}],
        {math:[gcdValName,">","0"]});
    dm.addInvokeEoc("Update",0,GCDEoc);
    out.push(GCDEoc);

    //遍历技能
    for(const skill of skills){
        const {id,cast_condition,cooldown,common_cooldown,after_effect,before_effect} = skill;
        //获取法术数据
        const spell = getSpellByID(id);

        //法术消耗字符串
        const spellCost=`min(${parseSpellNumObj(spell,"base_energy_cost")} + ${parseSpellNumObj(spell,"energy_increment")} * `+
                        `u_val('spell_level', 'spell: ${spell.id}'), ${parseSpellNumObj(spell,"final_energy_cost",MAX_NUM)})`;

        //法术消耗变量类型
        const costVar = spell.energy_source !== undefined
            ? COST_MAP[spell.energy_source]
            : undefined;

        //生成冷却变量名
        const cdValName = `u_${spell.id}_cooldown`;

        //计算成功效果
        const true_effect:EocEffect[]=[];
        //共通冷却
        if(common_cooldown!=0)
            true_effect.push({math:[gcdValName,"=",`${common_cooldown??1}`]});
        //施法消耗
        if(spell.base_energy_cost!=undefined && costVar!=undefined)
            true_effect.push({math:[costVar,"-=",spellCost]});
        //独立冷却
        if(cooldown)
            true_effect.push({math:[cdValName,"=",`${cooldown??0}`]});
        //追加效果
        if(after_effect)
            true_effect.push(...after_effect);
        //施法时间
        if(spell.base_casting_time){
            const ct =  `min(${parseSpellNumObj(spell,"base_casting_time")} + ${parseSpellNumObj(spell,"casting_time_increment")} * `+
                        `u_val('spell_level', 'spell: ${spell.id}'), ${parseSpellNumObj(spell,"final_casting_time",MAX_NUM)})`;
            true_effect.push(
                {math:[SPELL_CT_MODMOVE_VAR,"=",ct]},
                {u_cast_spell:{id:SPELL_CT_MODMOVE,hit_self:true}}
            );
        }

        //前置效果
        const pre_effect:EocEffect[] = [];
        if(before_effect) pre_effect.push(...before_effect)

        //遍历释放条件
        const ccs = Array.isArray(cast_condition)
            ?cast_condition
            :[cast_condition] as const;
        ccs.forEach((cc,i)=>cc.id = cc.id??i+"");

        //遍历释放条件生成施法eoc
        for(const cast_condition of ccs){
            const {target} = cast_condition;
            //计算基础条件 确保第一个为技能开关, 用于cast_control读取
            const base_cond: BoolObj[] = [
                {math:[getDisableSpellVar("u",spell),"!=","1"]},
                {math:[gcdValName,"<=","0"]},
            ];
            //能量消耗
            if(spell.base_energy_cost!=undefined && costVar!=undefined)
                base_cond.push({math:[costVar,">=",spellCost]});
            //冷却
            if(cooldown)
                base_cond.push({math:[cdValName,"<=","0"]});

            //处理并加入输出
            const dat:CastProcData = {
                skill, true_effect, pre_effect,
                base_cond, cast_condition
            }
            //生成法术
            out.push(...(await procSpellTarget(target,dm,dat)));
        }

        //独立冷却事件
        if(cooldown){
            const CDEoc=SADef.genActEoc(`${spell.id}_cooldown`,
                [{math:[cdValName,"-=","1"]}],
                {math:[cdValName,">","0"]})
            dm.addInvokeEoc("Update",0,CDEoc);
            out.push(CDEoc);
        }
    }

    dm.addStaticData(out,"skill");
}

