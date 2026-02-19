
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, updateProduct } from "@/app/actions/products";
import { productSchema, ProductFormValues } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface ProductFormProps {
    categories: { id: string, name: string }[];
    initialData?: ProductFormValues & { id: string };
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [openCategory, setOpenCategory] = useState(false);

    const form = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: initialData || {
            name: "",
            sku: "",
            categoryId: "",
            description: "",
            dimensions: "",
            status: "draft",
            specifications: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "specifications",
    });

    async function onSubmit(data: ProductFormValues) {
        setLoading(true);
        try {
            let result;
            if (initialData) {
                result = await updateProduct(initialData.id, data);
            } else {
                result = await createProduct(data);
            }

            if (result.success) {
                toast.success(result.message);
                router.push("/dashboard/products");
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Beklenmeyen bir hata oluştu.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">

                {/* Temel Bilgiler Grubu */}
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ürün Adı</FormLabel>
                                <FormControl>
                                    <Input placeholder="Örn: Akustik Panel P100" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stok Kodu (SKU)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Örn: P100-24" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Kategori Seçimi */}
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Kategori</FormLabel>
                                <Popover open={openCategory} onOpenChange={setOpenCategory}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "justify-between",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value
                                                    ? categories.find(
                                                        (category) => category.id === field.value
                                                    )?.name
                                                    : "Kategori seçin"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Kategori ara..." />
                                            <CommandList>
                                                <CommandEmpty>Kategori bulunamadı.</CommandEmpty>
                                                <CommandGroup>
                                                    {categories.map((category) => (
                                                        <CommandItem
                                                            value={category.name}
                                                            key={category.id}
                                                            onSelect={() => {
                                                                form.setValue("categoryId", category.id);
                                                                setOpenCategory(false);
                                                            }}
                                                        >
                                                            {category.name}
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto h-4 w-4",
                                                                    category.id === field.value
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Durum</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Durum seçin" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="draft">Taslak</SelectItem>
                                        <SelectItem value="published">Yayında</SelectItem>
                                        <SelectItem value="archived">Arşivlendi</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Açıklama</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ürün hakkında detaylı açıklama..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="dimensions"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Boyutlar</FormLabel>
                            <FormControl>
                                <Input placeholder="Örn: 100cm x 50cm x 5cm" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Dinamik Özellikler Editörü */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <FormLabel className="text-base">Teknik Özellikler</FormLabel>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ key: "", value: "" })}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Özellik Ekle
                        </Button>
                    </div>

                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2">
                            <FormField
                                control={form.control}
                                name={`specifications.${index}.key`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input placeholder="Özellik (örn. Yoğunluk)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`specifications.${index}.value`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input placeholder="Değer (örn. 24 dns)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mb-0.5" // visual alignment
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    <FormDescription>
                        Malzeme, yanmazlık sınıfı vb. teknik özellikler ekleyin.
                    </FormDescription>
                </div>

                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? "Kaydediliyor..." : initialData ? "Değişiklikleri Kaydet" : "Ürün Oluştur"}
                </Button>
            </form>
        </Form>
    );
}
