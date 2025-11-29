import { UserSplitAmountHash } from "../expenses/add-expense/page";

/**
 * Represents an expense in Expense table.
 */
type Expense = {
    item_name: String;
    list_id: number;
    item_total_cost: number;
    item_quantity: number;
    notes: String | undefined;
    bought_by_id: number;
}

/**
 * Represents a complete expense in the database, including item id and creation date.
 */
type CompleteExpense = {
    item_name: String;
    item_id: number;
    list_id: number;
    item_total_cost: number;
    item_quantity: number;
    notes: String | undefined;
    bought_by_id: number;
    date_bought: Date;
}

type Split = {
  item_id: number;
  amount_owed: number;
  profile_id: number;
}

/**
 * Represents a group in the Group table.
 */
export type GroupInfo = {
  group_id: number;
  group_name: string;
  date_created: string;
  group_photo: string | null;
  role: string;
  is_creator: boolean;
}

/**
 * Represents an expense list in the ExpenseList table
 */
export type GroupExpenseList = {
  list_name: string;
  list_id: number;
  group_id: number;
  date_closed: Date | null;
}

/**
 * Represents a user in the User table.
 */
export type UserInfo = {
  profile_id: number;
  profile_name: string;
  email: string;
  picture: string | null;
  birthday: Date | null;
}

/**
 * Gets a list of all of the groups a user is a part of given a user id.
 * 
 * @param profileId the profile id of the user whose groups are being retrieved.
 * @returns a list of GroupInfos, each representing a group the user is a part of.
 */
export async function getUserGroups(profileId: number) : Promise<GroupInfo[]> {
    const response = await fetch(`http://127.0.0.1:8000/api/groups?profile_id=${profileId}`);
    if (!response.ok) throw new Error(response.statusText)
    const data : Promise<GroupInfo[]> = response.json();
    return data;
}

/**
 * Gets a list of all members of a group given a group id.
 * 
 * @param groupId the group id from which the list of members is being retrieved.
 * @returns a list of UserInfos, each representing a member of the group.
 */
export async function getGroupMembers(groupId : number) : Promise<UserInfo[]> {
    const response = await fetch(`http://127.0.0.1:8000/api/groups/${groupId}/members`);
    if (!response.ok) throw new Error("Failed to fetch groups.");
    const data : Promise<UserInfo[]> = response.json();
    return data;
}

/**
 * Gets a list of all expense lists for a group given a group id.
 * 
 * @param groupId the group id for the group whose expense lists are being retrieved.
 * @returns a list of ExpenseLists, each representing an expense list for the target group.
 */
export async function getGroupExpenseLists(groupId : number) : Promise<GroupExpenseList[]> {
    const response = await fetch(`http://127.0.0.1:8000/api/groups/${groupId}/expenselists`);
    if (!response.ok) throw new Error("Failed to fetch groups.");
    const data : Promise<GroupExpenseList[]> = response.json();
    return data;
}

/**
 * Posts an Expense to the expenses table in the database.
 * 
 * @param expenseName the name of the expense.
 * @param listId the id of the expense list in which this expense is located.
 * @param cost the cost of this expense.
 * @param quantity the quantity of this expense.
 * @param notes any related notes for the expense.
 * @param payer the id of the user who paid for the expense.
 * @returns the item_id of the newly created item.
 */
export async function postExpense(expenseName: String,
                                    listId: number,
                                    cost: number,
                                    quantity: number,
                                    notes: String | undefined,
                                    payer: number) : Promise<number> {

       const expense: Expense = {
        item_name: expenseName,
        list_id: listId,
        item_total_cost: cost,
        item_quantity: quantity,
        notes: notes,
        bought_by_id: payer
    };
    const response = await fetch("http://127.0.0.1:8000/api/expenseslists/expenses", {
     method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expense),
    });
    if(!response.ok) throw new Error("Failed to post expense");
    const completeExpense : CompleteExpense = await response.json();
    return completeExpense.item_id;
}


export async function postSplits(itemId : number, amountSplits : UserSplitAmountHash) {
  for (const [id, amount] of Object.entries(amountSplits)) {
    console.log("Key: " + id + ", Value: " + amount);
    const split : Split = {
      item_id: itemId,
      profile_id: parseInt(id),
      amount_owed: amount
    };

    console.log(JSON.stringify(split));
    const response = await fetch("http://127.0.0.1:8000/api/expenseslists/expenses/splits", {
     method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(split),
    });
   console.log(await response.json());
  }
}