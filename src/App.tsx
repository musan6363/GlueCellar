import React, { useState, useRef, useEffect } from 'react';
import { WineCardForm } from './components/WineCardForm';
import { Menu, Plus, Wine, Star, ChevronDown, Pencil, Download, Upload, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { WineCard, DEFAULT_TASTES } from './types';

const WineBottle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v5a3 3 0 0 0-2 3v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V10a3 3 0 0 0-2-3V2z" />
    <path d="M8.5 15h7" />
    <path d="M10 2h4" />
  </svg>
);

function App() {
  const [view, setView] = useState<'gallery' | 'form'>('gallery');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Partial<WineCard> | undefined>(undefined);
  
  const [currentListId, setCurrentListId] = useState<string>('default-list-id');
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initDB = async () => {
      const count = await db.wineLists.count();
      if (count === 0) {
        await db.wineLists.put({
          id: 'default-list-id',
          name: 'GLUE CELLAR',
          isMyList: true,
          createdAt: new Date().toISOString()
        });
      }
    };
    initDB();
  }, []);

  const lists = useLiveQuery(() => db.wineLists.toArray()) || [];
  const cards = useLiveQuery(() => db.wineCards.where({ listId: currentListId }).toArray(), [currentListId]) || [];
  const currentList = lists.find(l => l.id === currentListId);

  // -------------------------
  // カードの保存・削除
  // -------------------------
  const handleSave = async (data: Partial<WineCard>) => {
    try {
      const newCard = {
        ...data,
        id: data.id || crypto.randomUUID(),
        listId: data.listId || currentListId,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as WineCard;

      await db.wineCards.put(newCard);
      setView('gallery');
      setEditingCard(undefined);
    } catch (error) {
      alert("保存に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('本当にこの記録を削除しますか？')) {
      await db.wineCards.delete(id);
      setView('gallery');
      setEditingCard(undefined);
    }
  };

  // -------------------------
  // リストの編集・削除
  // -------------------------
  const handleRenameList = async (id: string, oldName: string) => {
    const newName = window.prompt('新しいリスト名を入力してください', oldName);
    if (newName && newName.trim() !== '') {
      await db.wineLists.update(id, { name: newName.trim() });
    }
  };

  const handleDeleteList = async (id: string, name: string) => {
    if (lists.length <= 1) {
      alert('最後のリストは削除できません。');
      return;
    }
    
    if (window.confirm(`リスト「${name}」と、そこに含まれるすべての記録を削除しますか？\n※この操作は取り消せません。`)) {
      // リスト内のすべてのカードを削除
      const cardsToDelete = await db.wineCards.where({ listId: id }).primaryKeys();
      await db.wineCards.bulkDelete(cardsToDelete);
      
      // リスト自体を削除
      await db.wineLists.delete(id);
      
      // 削除したリストを現在開いていた場合、別のリストに切り替える
      if (currentListId === id) {
        const fallbackList = lists.find(l => l.id !== id);
        if (fallbackList) {
          setCurrentListId(fallbackList.id);
        }
      }
    }
  };

  // -------------------------
  // JSON エクスポート / インポート
  // -------------------------
  const handleExport = () => {
    if (!currentList) return;
    setIsMenuOpen(false);

    const exportData = {
      list: currentList,
      cards: cards
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const date = new Date();
    const dateString = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const safeTitle = currentList.name.replace(/[\s\/\\?%*:|"<>\.]/g, '_');
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dateString}_${safeTitle}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.list || !data.cards) throw new Error("不正なフォーマットです");

        const newListId = crypto.randomUUID();
        const newList = {
          ...data.list,
          id: newListId,
          isMyList: false,
          createdAt: new Date().toISOString()
        };

        const newCards = data.cards.map((card: WineCard) => ({
          ...card,
          id: crypto.randomUUID(),
          listId: newListId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        await db.wineLists.put(newList);
        await db.wineCards.bulkPut(newCards);

        setCurrentListId(newListId);
        setIsMenuOpen(false);
        alert(`「${newList.name}」をインポートしました！`);
      } catch (err) {
        alert("ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#2a2a2a]">
      <input type="file" accept=".json" ref={importInputRef} onChange={handleImport} className="hidden" />

      {/* Header */}
      <header className="p-4 flex justify-between items-center z-10 text-white relative border-b border-gray-700/50 shadow-md">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Menu size={28} />
        </button>

        {/* リストタイトルと切り替えドロップダウン */}
        <div className="relative">
          <button 
            onClick={() => setIsListMenuOpen(!isListMenuOpen)} 
            className="flex items-center gap-2 hover:opacity-70 transition-opacity p-2 rounded"
          >
            <h1 className="text-xl font-bold tracking-widest font-sans max-w-[200px] truncate">{currentList?.name || 'GLUE CELLAR'}</h1>
            <ChevronDown size={20} />
          </button>

          {isListMenuOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white text-black p-2 rounded shadow-xl z-50 min-w-[280px]">
              <ul className="space-y-1">
                <li className="font-bold border-b pb-2 px-2 text-sm text-gray-500 mb-2">リストを切り替え</li>
                {lists.map(list => (
                  <li key={list.id} className="flex justify-between items-center hover:bg-gray-100 rounded px-2 py-2 transition-colors">
                    <span
                      className={`cursor-pointer flex-1 py-1 ${list.id === currentListId ? 'font-bold text-orange-800' : ''} truncate`}
                      onClick={() => { setCurrentListId(list.id); setIsListMenuOpen(false); }}
                    >
                      {list.name}
                    </span>
                    <div className="flex gap-1 ml-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRenameList(list.id, list.name); }} 
                        className="p-2 text-gray-400 hover:text-orange-800 transition-colors rounded-full hover:bg-gray-200"
                        title="名前を変更"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id, list.name); }} 
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-100"
                        title="リストを削除"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="w-10"></div>
        
        {/* ハンバーガーメニュー */}
        {isMenuOpen && (
          <div className="absolute top-16 left-4 bg-white text-black p-4 rounded shadow-xl z-50 min-w-[220px]">
            <ul className="space-y-4">
              <li className="font-bold border-b pb-2 text-gray-600">メニュー</li>
              <li className="cursor-pointer hover:text-orange-800 flex items-center gap-3" onClick={handleExport}>
                <Download size={18} /> 今のリストを出力 (JSON)
              </li>
              <li className="cursor-pointer hover:text-orange-800 flex items-center gap-3" onClick={() => importInputRef.current?.click()}>
                <Upload size={18} /> リストを取り込む (JSON)
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex items-center justify-center p-4">
        {view === 'form' ? (
          <WineCardForm 
            initialData={editingCard}
            onSave={handleSave} 
            onDelete={editingCard?.id ? () => handleDelete(editingCard.id!) : undefined}
            onCancel={() => { setView('gallery'); setEditingCard(undefined); }}
          />
        ) : (
          <div className="w-full h-full flex items-center overflow-x-auto snap-x snap-mandatory cover-flow-container gap-8 px-[10vw]">
            {cards.length === 0 ? (
              <div className="text-white text-center w-full opacity-60 flex flex-col items-center">
                <Wine size={48} className="mb-4" />
                <p>このリストにはまだ記録がありません。<br/>右下の「＋」から追加してください。</p>
              </div>
            ) : (
              cards.map((card) => (
                <div 
                  key={card.id} 
                  className="snap-center shrink-0 w-[85vw] max-w-[400px] cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => { setEditingCard(card); setView('form'); }}
                >
                  <div className="bg-craft-paper p-6 relative flex flex-col gap-4 text-gray-800 border-t-[12px] border-[#eaddcf] shadow-xl h-[70vh] overflow-y-auto">
                     <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#eaddcf] opacity-80 rotate-[-2deg]"></div>
                     
                     <div className="flex flex-col gap-3">
                       <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                         <span className="text-sm font-bold opacity-70">Name</span>
                         <span className="flex-1 text-3xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">{card.name || ' '}</span>
                       </div>
                       <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                         <span className="text-sm font-bold opacity-70">Country</span>
                         <span className="flex-1 text-xl">{card.country || ' '}</span>
                       </div>
                       <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                         <span className="text-sm font-bold opacity-70">Grapes</span>
                         <span className="flex-1 text-xl">{card.grapes || ' '}</span>
                       </div>
                     </div>

                     <div className="flex flex-wrap gap-y-3 justify-between items-center my-3 border-b border-gray-400/50 pb-3">
                       <div className="flex items-center">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <div key={star} className={`p-1 ${star <= (card.rating5 || 0) ? 'text-orange-700' : 'text-gray-400'}`}>
                             <Star size={18} strokeWidth={1.5} fill={star <= (card.rating5 || 0) ? "currentColor" : "none"} />
                           </div>
                         ))}
                       </div>
                       <div className="flex gap-4 items-center ml-auto">
                         <div className="flex items-center gap-2">
                           <WineBottle size={18} />
                           <span className="text-lg w-4 text-center">{card.bottleCount || 0}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <Wine size={18} />
                           <span className="text-lg w-4 text-center">{card.glassCount || 0}</span>
                         </div>
                       </div>
                     </div>

                     <div>
                       <span className="text-sm font-bold opacity-70 block mb-2">Tastes</span>
                       <div className="grid grid-cols-4 gap-x-2 gap-y-4 text-center text-sm">
                         {DEFAULT_TASTES.map(taste => {
                           const level = card.tastes?.[taste] || 0;
                           return (
                             <div
                               key={taste}
                               className={`py-1 px-1 taste-oval ${
                                 level === 0 ? 'border border-transparent opacity-50' :
                                 level === 1 ? 'border-2 border-dashed border-gray-700' :
                                 'border-2 border-solid border-gray-800 font-bold'
                               }`}
                             >
                               {taste}
                             </div>
                           );
                         })}
                       </div>
                     </div>

                     <div className="mt-4 border border-gray-400 p-2 relative min-h-[100px]">
                       <span className="absolute -top-3 left-2 bg-transparent text-sm font-bold opacity-70 bg-[#d4c4b7] px-1">memo</span>
                       <div className="mt-2 leading-relaxed whitespace-pre-wrap">{card.memo}</div>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      {view === 'gallery' && (
        <button 
          onClick={() => { setEditingCard(undefined); setView('form'); }}
          className="absolute bottom-8 right-8 bg-orange-800 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-20"
        >
          <Plus size={32} />
        </button>
      )}
    </div>
  );
}

export default App;
