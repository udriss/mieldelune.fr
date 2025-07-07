'use client';

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    MouseSensor,
    TouchSensor,
    KeyboardSensor,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {SortableEvent} from '@/components/admin/SortableEvent';
import { Wedding } from '@/lib/dataTemplate';
import { Button } from "@/components/ui/button";
import { toast } from 'react-toastify';
import { myFetch } from '@/lib/fetch-wrapper';

type AdminClientWrapperProps = {
    weddings: Wedding[];
    onWeddingsUpdated?: (updatedWeddings: Wedding[]) => void;
};

const dropAnimationConfig = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

const AdminClientWrapper: React.FC<AdminClientWrapperProps> = ({ weddings, onWeddingsUpdated }) => {
    const [items, setItems] = useState<Wedding[]>([]);
    const [activeId, setActiveId] = useState<string | number | null>(null);
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor),
    );

    useEffect(() => {
        if (weddings && weddings.length > 0) {
            setItems([...weddings].sort((a, b) => Number(a.id) - Number(b.id)));
        }
    }, [weddings]);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        if (active.id !== over.id) {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            setItems(arrayMove(items, oldIndex, newIndex));
        }
    };

    const saveOrder = async () => {
        const updatedItems = items.map((wedding, index) => ({
            oldId: wedding.id,
            newId: index + 1,
        }));

        try {
            const response = await myFetch('/api/updateOrder/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItems),
            });

            if (!response.ok) {
                toast.error('Failed to save order.');
                return;
            }

            const data = await response.json();
            if (data.updatedWeddings) {
                // Mettez à jour la liste locale, triée si besoin
                const newList = [...data.updatedWeddings].sort(
                    (a, b) => Number(a.id) - Number(b.id)
                );
                setItems(newList);

                // Optionnel : faire remonter les données au parent
                if (onWeddingsUpdated) {
                    onWeddingsUpdated(newList);
                }
            }
            toast.success('🎉 Ordre mis à jour', {
                position: "top-center",
                autoClose: 1500,
                hideProgressBar: false,
                theme: "dark",
                style: {
                  width: '300px',
                },
              });
        } catch (error) {
            toast.error('An error occurred while saving the order.');
        }
    };

    return (
        <div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((wedding) => (
                        <SortableEvent key={wedding.id} wedding={wedding} />
                    ))}
                </SortableContext>
                <DragOverlay dropAnimation={dropAnimationConfig}>
                    {activeId ? (
                        <div className="min-w-[180px] max-w-[420px] relative aspect-auto overflow-hidden rounded-lg py-2 border-2 border-blue-500 shadow-lg bg-white opacity-90 flex flex-col items-center justify-center">
                            {/* Optionnel: afficher un aperçu du mariage en drag, ici juste le titre */}
                            <p className="font-bold text-lg">{items.find(i => i.id === activeId)?.title || ''}</p>
                            <p className="text-base">{items.find(i => i.id === activeId)?.date || ''}</p>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
            <div className="w-full mt-4 flex justify-end">
                <Button onClick={saveOrder}
        variant={'outline'}
        className="col-span-3 bg-white border-gray-300 text-black hover:bg-green-100  border-gray-300"
                >Enregistrer l'ordre des mariages</Button>
                </div>
            
        </div>
    );
};

export default AdminClientWrapper;