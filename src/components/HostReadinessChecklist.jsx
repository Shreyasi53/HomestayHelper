import React, { useState, useEffect } from 'react';
import { DEFAULT_CATEGORIES } from '../data/checklist';
import {
  ClipboardCheck,
  BedDouble,
  Droplets,
  Utensils,
  Luggage,
  ClipboardList,
  Plus,
  Trash2
} from 'lucide-react';

const STORAGE_KEY = 'homestay_checklist_data_v2';

export default function HostReadinessChecklist() {
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure Safety card is removed even if present in old cached state
        return parsed.filter(
          (c) => c.id !== 'cat_safety' && c.title !== 'Safety & Emergency Preparedness' && c.category !== 'Safety & Emergency Preparedness'
        );
      }
    } catch (e) {
      console.warn('Error loading checklist data:', e);
    }
    return DEFAULT_CATEGORIES;
  });

  // State for Add Task inline form (category ID where task is being added)
  const [addingTaskCatId, setAddingTaskCatId] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');

  // State for Add Category form
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  // State for confirmation modal: { type: 'task' | 'category', catId, taskId, message }
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.warn('Could not save checklist data:', e);
    }
  }, [categories]);

  // Helper to pick Lucide icon for category
  const renderCategoryIcon = (cat) => {
    if (cat.id === 'cat_room') return <BedDouble className="w-4 h-4 text-forest-800" aria-hidden="true" />;
    if (cat.id === 'cat_hyg') return <Droplets className="w-4 h-4 text-forest-800" aria-hidden="true" />;
    if (cat.id === 'cat_meal') return <Utensils className="w-4 h-4 text-forest-800" aria-hidden="true" />;
    return <Luggage className="w-4 h-4 text-forest-800" aria-hidden="true" />;
  };

  // --- Task Operations ---
  const toggleTask = (catId, taskId) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          tasks: cat.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
        };
      })
    );
  };

  const handleAddTask = (catId) => {
    const trimmed = newTaskText.trim();
    if (!trimmed) return;

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: trimmed,
      completed: false
    };

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          tasks: [...cat.tasks, newTask]
        };
      })
    );

    setNewTaskText('');
    setAddingTaskCatId(null);
  };

  const requestDeleteTask = (catId, taskId, taskText) => {
    setConfirmModal({
      type: 'task',
      catId,
      taskId,
      title: 'Delete Task',
      message: 'Delete this task?',
      preview: taskText
    });
  };

  // --- Category Operations ---
  const handleAddCategory = (e) => {
    e?.preventDefault();
    const trimmed = newCategoryTitle.trim();
    if (!trimmed) return;

    const newCat = {
      id: `cat_custom_${Date.now()}`,
      title: trimmed,
      custom: true,
      tasks: []
    };

    setCategories((prev) => [...prev, newCat]);
    setNewCategoryTitle('');
    setIsAddingCategory(false);
  };

  const requestDeleteCategory = (catId, catTitle) => {
    setConfirmModal({
      type: 'category',
      catId,
      title: 'Delete Category',
      message: 'Delete this checklist category and all its tasks?',
      preview: catTitle
    });
  };

  // --- Confirm Modal Handler ---
  const handleConfirmAction = () => {
    if (!confirmModal) return;

    if (confirmModal.type === 'task') {
      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id !== confirmModal.catId) return cat;
          return {
            ...cat,
            tasks: cat.tasks.filter((t) => t.id !== confirmModal.taskId)
          };
        })
      );
    } else if (confirmModal.type === 'category') {
      setCategories((prev) => prev.filter((cat) => cat.id !== confirmModal.catId));
    }

    setConfirmModal(null);
  };

  // --- Progress Calculations ---
  const totalItems = categories.reduce((acc, cat) => acc + (cat.tasks ? cat.tasks.length : 0), 0);
  const doneCount = categories.reduce(
    (acc, cat) => acc + (cat.tasks ? cat.tasks.filter((t) => t.completed).length : 0),
    0
  );
  const progressPct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

  return (
    <div>
      {/* Progress Bar Banner */}
      <div className="bg-gradient-to-br from-forest-900 to-forest-800 text-white rounded-2xl p-5 mb-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-300" aria-hidden="true" />
              <span>Homestay Hosting Readiness</span>
            </h3>
            <p className="text-xs text-emerald-200 mt-0.5">
              Preparation checklist for hosting guests comfortably.
            </p>
          </div>
          <div className="text-2xl font-bold text-amberGold">{progressPct}%</div>
        </div>
        <div className="w-full bg-slate-700/50 rounded-pill h-2.5 overflow-hidden mb-2">
          <div
            className="bg-gradient-to-r from-emerald-400 to-amberGold h-full transition-all duration-300 rounded-pill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-right opacity-80">
          {doneCount} of {totalItems} items completed
        </p>
      </div>

      {/* Interactive Checklist Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              {/* Category Header */}
              <div className="flex justify-between items-center mb-3">
                <div className="text-base font-bold text-forest-800 flex items-center gap-2">
                  {renderCategoryIcon(cat)}
                  <span>{cat.title || cat.category}</span>
                </div>
                {cat.custom && (
                  <button
                    onClick={() => requestDeleteCategory(cat.id, cat.title || cat.category)}
                    title="Delete category"
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors text-xs flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div className="space-y-2 mb-3">
                {cat.tasks && cat.tasks.map((task) => {
                  const isChecked = task.completed;
                  return (
                    <div
                      key={task.id}
                      className={`flex items-start justify-between gap-2 p-3 rounded-xl border transition-all select-none group ${
                        isChecked
                          ? 'bg-slate-100 border-slate-200 opacity-70 text-slate-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div
                        onClick={() => toggleTask(cat.id, task.id)}
                        className="flex items-start gap-3 flex-1 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by div click
                          className="mt-0.5 w-4 h-4 accent-forest-800 rounded cursor-pointer"
                        />
                        <span className={`text-sm leading-snug ${isChecked ? 'line-through' : ''}`}>
                          {task.text}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteTask(cat.id, task.id, task.text);
                        }}
                        title="Delete task"
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-200 transition-colors opacity-80 group-hover:opacity-100 text-xs shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}

                {cat.tasks && cat.tasks.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2 text-center">
                    No tasks yet in this category. Click below to add one!
                  </p>
                )}
              </div>
            </div>

            {/* Add Task Form / Button */}
            <div className="pt-2 border-t border-slate-100">
              {addingTaskCatId === cat.id ? (
                <div className="space-y-2 animate-fadeIn bg-slate-50 p-2.5 rounded-xl border border-forest-200">
                  <input
                    type="text"
                    autoFocus
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTask(cat.id);
                      } else if (e.key === 'Escape') {
                        setAddingTaskCatId(null);
                        setNewTaskText('');
                      }
                    }}
                    placeholder="e.g. Check extra blankets..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-forest-700 bg-white"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingTaskCatId(null);
                        setNewTaskText('');
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTask(cat.id)}
                      className="px-3 py-1 text-xs font-bold text-white bg-forest-800 hover:bg-forest-700 rounded-lg shadow-sm"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAddingTaskCatId(cat.id);
                    setNewTaskText('');
                  }}
                  className="w-full py-1.5 text-xs font-bold text-forest-800 hover:text-forest-900 hover:bg-forest-50 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-dashed border-forest-300 hover:border-forest-600"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add Task</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* "+ Add More" Category Card */}
        <div className="bg-white rounded-2xl p-5 border-2 border-dashed border-slate-300 hover:border-forest-700 transition-all shadow-sm flex flex-col items-center justify-center min-h-[220px] text-center">
          {isAddingCategory ? (
            <form onSubmit={handleAddCategory} className="w-full space-y-3 p-1 animate-fadeIn">
              <h4 className="text-sm font-bold text-forest-800">Create New Checklist Category</h4>
              <input
                type="text"
                autoFocus
                value={newCategoryTitle}
                onChange={(e) => setNewCategoryTitle(e.target.value)}
                placeholder="e.g. Guest Arrival, Bonfire Night..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-forest-700 bg-white"
              />
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryTitle('');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-forest-800 hover:bg-forest-700 rounded-lg shadow-sm"
                >
                  Create Category
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingCategory(true)}
              className="w-full h-full flex flex-col items-center justify-center p-4 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-800 group-hover:bg-forest-100 flex items-center justify-center text-2xl font-bold mb-2 transition-colors">
                <Plus className="w-6 h-6 text-forest-800" aria-hidden="true" />
              </div>
              <div className="text-base font-bold text-forest-800 mb-1 group-hover:text-forest-900">
                Add More
              </div>
              <p className="text-xs text-slate-500 max-w-[200px]">
                Create your own checklist category
              </p>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-800 mb-2">{confirmModal.title}</h4>
            <p className="text-sm text-slate-600 mb-3">{confirmModal.message}</p>
            {confirmModal.preview && (
              <div className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-700 font-medium italic border border-slate-200 mb-4 truncate">
                "{confirmModal.preview}"
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
