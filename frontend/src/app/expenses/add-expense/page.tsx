'use client'

import { useEffect, useState } from 'react';
import Select from 'react-select';
import { useRouter } from 'next/navigation';
import { getGroupExpenseLists, getGroupMembers, getUserGroups, postExpense, GroupInfo, GroupExpenseList, UserInfo, postSplits } from '@/app/services/expenseService';

export interface UserSplitAmountHash {
  [key: number]: number;
}

export default function AddExpense() {
  const router = useRouter();

  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [customSplit, setCustomSplit] = useState<boolean>(false);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<number>();
  const [payer, setPayer] = useState<number>();
  const [groupMembers, setGroupMembers] = useState<UserInfo[]>([]);
  const [groupExpenseLists, setGroupExpenseLists] = useState<GroupExpenseList[]>([]);
  const [selectedList, setSelectedList] = useState<number>();

  const [expenseName, setExpenseName] = useState<String>();
  const [cost, setCost] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState<String>();

  const [splitMembers, setSplitMembers] = useState<number[]>([]);
  const [splitAmounts, setSplitAmounts] = useState<UserSplitAmountHash>({});
  const [userSplitHashMap, setUserSplitHashMap] = useState<UserSplitAmountHash>({});

  const addOrUpdateSplit = (id: number, amount: number) => {
    setUserSplitHashMap(prev => ({
      ...prev,
      [id]: amount,
    }));
  };

  const getSplit = (userId: number) => {
    return userSplitHashMap[userId];
  };

  const deleteSplit = (userId: number) => {
    setUserSplitHashMap(prev => {
      const newMap: UserSplitAmountHash = { ...prev };
      delete newMap[userId];
      return newMap;
    })
  };

  useEffect(() => {
    async function loadGroups() {
      setLoading(true);
      try {
        const data = await getUserGroups(155);
        setGroups(data);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 px-6 pb-8 pt-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Add New Expense</h1>
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Group *
            </label>
            <Select
              className="w-full text-gray-700 rounded-lg"
              instanceId={"group-select"}
              options={
                groups.map(group => ({
                  value: group.group_id,
                  label: group.group_name
                }))}
              isLoading={loading}
              placeholder="Select group..."
              onChange={async (e) => {

                const newGroupId = e?.value || undefined;
                setSelectedGroup(newGroupId);

                if (newGroupId != undefined) {
                  const members: UserInfo[] = await getGroupMembers(newGroupId);
                  setGroupMembers(members);

                  const lists: GroupExpenseList[] = await getGroupExpenseLists(newGroupId);
                  setGroupExpenseLists(lists);
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              List *
            </label>
            <Select
              className="w-full text-gray-700"
              instanceId={"list-select"}
              placeholder={"Select expense list..."}
              options={groupExpenseLists.map(list => ({
                label: list.list_name,
                value: list.list_id
              }))}
              onChange={(e) => setSelectedList(e?.value || undefined)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Expense Name *
            </label>
            <input
              type="text"
              className="w-full border-2 border-gray-300 text-gray-700 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
              placeholder="What was this expense for?"
              onChange={(e) => setExpenseName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Total Cost *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-700 text-lg">$</span>
              <input
                type="number"
                step="1.00"
                className="w-full border-2 border-gray-300 rounded-lg p-2 pl-8 text-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="0.00"
                onChange={(e) => setCost(parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 pt-6">
                Description
              </label>
              <input
                type="text"
                className="w-full border-2 border-gray-300 text-gray-700 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                placeholder="What was this expense for?"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 pt-6">
                Date *
              </label>
              <input
                type="date"
                className="w-full border-2 border-gray-300 text-gray-700 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Recurring Expense?</span>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-14 h-7 rounded-full transition relative ${isRecurring ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition transform absolute top-1 ${isRecurring ? 'translate-x-7' : 'translate-x-1'
                  }`}></div>
              </button>
            </div>

            {isRecurring && (
              <div className="pl-4 border-l-4 border-blue-500">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Frequency
                </label>
                <select className="w-full border-2 border-gray-300 rounded-lg p-2 bg-white focus:border-blue-500 focus:outline-none">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>
            )}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition cursor-pointer">
            <div className="text-center">
              <div className="text-5xl mb-3">📤</div>
              <div className="text-gray-700 font-medium mb-1">Upload Receipt</div>
              <div className="text-sm text-gray-500">Click or drag file to upload</div>
            </div>
          </div>


          <div className="space-y-4 border-t pt-6">

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Who Paid? *
                </label>
                <Select
                  className="w-full text-gray-700 rounded-lg"
                  instanceId={"payer-select"}
                  options={groupMembers.map(member => ({
                    label: member.profile_name,
                    value: member.profile_id
                  }))}
                  onChange={e => setPayer(e?.value || undefined)}
                  placeholder={"Select payer"}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Split With
                </label>
                <Select
                  className="w-full text-gray-700 rounded-lg"
                  instanceId="split-select"
                  placeholder={"Select who to split with"}
                  isMulti={true}
                  options={groupMembers.filter((member) => member.profile_id != payer).map((member) => ({
                    label: member.profile_name,
                    value: member.profile_id
                  }))}
                  onChange={e => {
                    const selectedIds = e?.map(member => member.value) || [];
                    setSplitMembers(selectedIds)
                    console.log(selectedIds);
                    const idsToRemove: number[] = Object.keys(userSplitHashMap)
                      .map(key => parseInt(key)).filter(key => !selectedIds.includes(key));
                    idsToRemove.forEach(id => deleteSplit(id));
                    selectedIds.forEach(id => addOrUpdateSplit(id, cost / (selectedIds.length + 1)));
                  }}

                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-700 font-medium">Custom Split?</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!customSplit) {
                      setSplitAmounts({});
                    } else {
                      setSplitAmounts({});
                    }
                    setCustomSplit(!customSplit);

                  }
                  }
                  className={`w-14 h-7 rounded-full transition relative ${customSplit ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition transform absolute top-1 ${customSplit ? 'translate-x-7' : 'translate-x-1'
                    }`}></div>
                </button>
              </div>

              {customSplit && (
                <div className="space-y-2 pl-4 border-l-4 border-blue-500">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Split Amounts:</div>
                  {groupMembers.filter((member) => member.profile_id != payer
                    && splitMembers.includes(member.profile_id)).map((member) => (
                      <div key={member.profile_id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-20">{member.profile_name}</span>
                        <input
                          type="number"
                          step="0.01"
                          className="flex-1 border border-gray-300 rounded p-2 text-sm bg-white text-gray-700"
                          placeholder="0.00"
                          defaultValue={cost / (splitMembers.length + 1)}
                          key={member.profile_id}
                          onChange={e => addOrUpdateSplit(member.profile_id, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/expenses')}
              className="flex-1 bg-gray-200 text-gray-700 font-semibold py-4 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-green-700 text-white font-semibold py-4 rounded-lg hover:bg-green-800 transition shadow-lg flex items-center justify-center gap-2"
              onClick={async () => {
                if (!expenseName || !selectedList || !cost /**!quantity */ || !payer) {
                  alert("Please fill all required fields.")
                  console.log("expenseName:", expenseName);
                  console.log("selectedList:", selectedList);
                  console.log("cost:", cost);
                  console.log("quantity:", 1);
                  console.log("payer:", payer);
                } else {
                  // router.push('/expenses');
                  const newExpenseId: number = await postExpense(expenseName!, selectedList!, cost, 1/**quantity */, description, payer);
                  if (splitMembers.length > 0) {
                    if (customSplit) {
                      postSplits(newExpenseId, userSplitHashMap);
                    } else {
                      const splitAmount = cost / (splitMembers.length + 1);
                      for (var i = 0; i < splitMembers.length; i++) {
                        addOrUpdateSplit(splitMembers[i], splitAmount);
                      }
                      postSplits(newExpenseId, userSplitHashMap);
                    }
                  }
                }
              }}
            >
              <span className="text-xl">+</span>
              Add Expense
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}