// =====================================================
// Skill Check Child Script (Link 4) - Non-Combat Only
// Updated: Show the attribute key (STR/AGI/PRE/WIS) in roll output
//          and adjust dice pool to: (half attribute value, rounded) + skill value
// =====================================================

integer SKILL_DIALOG_CHANNEL = -999999; // Unique channel for skill checks

string skillData = "";

// Non-combat skills in alphabetical order, no "Melee" or "Ranged"
list g_skillList = [
    "Acrobatics", "Artist", "Astronomy", 
    "Bargain", "Bureaucracy", 
    "Fame", "Guard", 
    "Infamy", "Investigate", 
    "Language", 
    "Medicine", "Movement", 
    "Nature", 
    "Perform", 
    "Scholar", "Security", 
    "Sleight of Hand", "Stealth", "Streetwise", 
    "Willpower"
];

integer g_currentPage = 0;
integer MAX_BUTTONS    = 12;
string PREV_BUTTON     = "Previous";
string NEXT_BUTTON     = "Next";
string CANCEL_BUTTON   = "Cancel";

// -------------------- Conversion Routines --------------------
integer isDigit(string ch) {
    if(ch=="0"||ch=="1"||ch=="2"||ch=="3"||
       ch=="4"||ch=="5"||ch=="6"||ch=="7"||ch=="8"||ch=="9")
       return TRUE;
    return FALSE;
}

integer digitToInteger(string ch) {
    if(ch=="0") return 0;
    else if(ch=="1") return 1;
    else if(ch=="2") return 2;
    else if(ch=="3") return 3;
    else if(ch=="4") return 4;
    else if(ch=="5") return 5;
    else if(ch=="6") return 6;
    else if(ch=="7") return 7;
    else if(ch=="8") return 8;
    else if(ch=="9") return 9;
    return 0;
}

integer stringToInt(string s) {
    integer len = llStringLength(s);
    if(len<=0) return 0;
    integer result = 0;
    integer negative = FALSE;
    integer i = 0;
    
    if(llGetSubString(s,0,0)=="-"){
        negative = TRUE;
        i = 1;
    }
    while(i < len){
        string ch = llGetSubString(s, i, i);
        if(isDigit(ch)){
            result = result * 10 + digitToInteger(ch);
            i++;
        } else {
            i = len; // end
        }
    }
    if(negative) result = -result;
    return result;
}

// Extract an integer after "keyName=" from skillData
integer getIntValue(string data, string keyName) {
    list fields = llParseString2List(data, ["|"], []);
    integer count = llGetListLength(fields);
    integer i;
    string searchKey = keyName + "=";
    integer prefixLen = llStringLength(keyName) + 1;
    
    for(i = 0; i < count; i++){
        string element = llList2String(fields, i);
        if(llSubStringIndex(element, searchKey) == 0){
            string valStr = llGetSubString(element, prefixLen, -1);
            return stringToInt(valStr);
        }
    }
    return 0;
}

// Rolls numDice d6, returns [ total, "[x,y,z]" ]
list rollDiceList(integer numDice) {
    integer total = 0;
    integer i;
    string diceArr = "[";
    for(i = 0; i < numDice; i++){
        integer dieVal = (integer)llFrand(6.0) + 1;
        total += dieVal;
        diceArr += (string)dieVal;
        if(i < (numDice - 1)) diceArr += ",";
    }
    diceArr += "]";
    return [ total, diceArr ];
}

// Returns the attribute key associated with a skill, or "" if not recognized.
string getAssociatedAttribute(string skill) {
    string lowerSkill = llToLower(skill);
    if(lowerSkill == "movement" || lowerSkill == "willpower")
        return "STR";
    else if(lowerSkill == "acrobatics" || lowerSkill == "sleight of hand")
        return "AGI";
    else if(lowerSkill == "bargain" || lowerSkill == "bureaucracy" ||
            lowerSkill == "fame" || lowerSkill == "infamy" || lowerSkill == "investigate" || lowerSkill == "perform" || lowerSkill == "stealth" || lowerSkill == "streetwise")
        return "PRE";
    else if(lowerSkill == "artist" || lowerSkill == "astronomy" || lowerSkill == "guard" ||
            lowerSkill == "language" || lowerSkill == "medicine" || lowerSkill == "nature" || lowerSkill == "scholar" || lowerSkill == "security")
        return "WIS";
    return "";
}

// Reverse a list if your viewer displays them bottom->top.
list listReverse(list inputList) {
    integer len = llGetListLength(inputList);
    list reversed = [];
    integer i;
    for(i = len - 1; i >= 0; i--){
        reversed += [ llList2String(inputList, i) ];
    }
    return reversed;
}

// Build the skill dialog with up to 9 skills per page, then [Prev,Next,Cancel].
list buildSkillDialog() {
    integer totalSkills = llGetListLength(g_skillList);
    integer itemsPerPage = 9;
    integer totalPages = (totalSkills + itemsPerPage - 1) / itemsPerPage;
    
    if(g_currentPage < 0) {
        g_currentPage = totalPages - 1;
    }
    if(g_currentPage >= totalPages){
        g_currentPage = 0;
    }
    
    integer startIndex = g_currentPage * itemsPerPage;
    integer endIndex = startIndex + itemsPerPage - 1;
    if(endIndex >= totalSkills) endIndex = totalSkills - 1;
    
    list pageSkills = llList2List(g_skillList, startIndex, endIndex);
    list desiredDisplay = pageSkills + [ "Previous", "Next", "Cancel" ];
    
    // Reverse if viewer inverts them
    return listReverse(desiredDisplay);
}

showSkillDialog() {
    list buttons = buildSkillDialog();
    integer totalSkills = llGetListLength(g_skillList);
    integer itemsPerPage = 9;
    integer totalPages = (totalSkills + itemsPerPage - 1) / itemsPerPage;
    
    llDialog(
        llGetOwner(),
        "Select a non-combat skill (Page " + (string)(g_currentPage + 1) + " of " + (string)totalPages + "):",
        buttons,
        SKILL_DIALOG_CHANNEL
    );
}

processSkillSelection(string selection) {
    if(selection == "Next"){
        g_currentPage++;
        showSkillDialog();
        return;
    }
    else if(selection == "Previous"){
        g_currentPage--;
        showSkillDialog();
        return;
    }
    else if(selection == "Cancel"){
        llSay(0, "Skill roll cancelled.");
        return;
    }
    
    // If skill isn't in g_skillList, ignore it
    integer idx = llListFindList(g_skillList, [selection]);
    if(idx == -1){
        llSay(0, "Skill '" + selection + "' is not handled by this prim.");
        return;
    }
    
    // Parse charName from skillData's field 0
    list fields = llParseString2List(skillData, ["|"], []);
    string charName = llList2String(fields, 0);
    
    // Find attribute
    string attrKey = getAssociatedAttribute(selection);
    integer attrVal = 0;
    if(attrKey != ""){
        attrVal = getIntValue(skillData, attrKey);
    }
    integer skillVal = getIntValue(skillData, selection);
    // Adjusted dice pool: half the attribute value (rounded to the nearest whole number) plus the skill value
    integer dicePool = llRound(((float)attrVal) / 2.0) + skillVal;
    
    // Updated output: we use the actual attrKey
    llSay(0, charName + " rolls for " + selection +
        " (" + attrKey + "=" + (string)attrVal +
        ", Skill=" + (string)skillVal +
        ", Pool=" + (string)dicePool + ")");
    
    list rollResultList = rollDiceList(dicePool);
    integer rollTotal = llList2Integer(rollResultList, 0);
    string diceArrayStr = llList2String(rollResultList, 1);
    
    llSay(0, charName + " totaled " + (string)rollTotal + " " + diceArrayStr);
}

default
{
    link_message(integer sender_num, integer num, string str, key id){
        if(num == 200){
            skillData = str;
            // llSay(0, "Skill Data Received: " + str);
        }
    }
    
    touch_start(integer total_number){
        if(skillData != ""){
            g_currentPage = 0;
            showSkillDialog();
        } else {
            llSay(0, "Skill data not available yet.");
        }
    }
    
    listen(integer channel, string name, key id, string message){
        if(channel == SKILL_DIALOG_CHANNEL){
            processSkillSelection(message);
        }
    }
    
    state_entry(){
        // Listen for skill responses on SKILL_DIALOG_CHANNEL
        llListen(SKILL_DIALOG_CHANNEL, "", llGetOwner(), "");
    }
    
    attach(key avatar) {
        if(avatar != NULL_KEY) 
            llResetScript();
    }
}
