import { useState } from "react";
import { Card, CardHeader } from "./card";
import { Button } from "./button";
import { FormInput } from "./formInput";

interface DepartmentFormProps {
  onSubmit: (data: {
    code: string;
    name: string;
    isActive: boolean;
  }) => void;
}

export function DepartmentForm({ onSubmit }: DepartmentFormProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ code: "", name: "", isActive: true });
  };

  return (
    <Card>
      <CardHeader className="p-2">Add New Department</CardHeader>
      <form onSubmit={handleSubmit} className="space-y-5 p-6 grid grid-cols-2 gap-4">
        <FormInput
          label="Department Code"
          type="text"
          placeholder="e.g., CS, EE, ME"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
        />

        <FormInput
          label="Department Name"
          type="text"
          placeholder="e.g., Computer Science"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div className="flex items-center col-span-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Active Department
          </label>
        </div>

        <Button type="submit" fullWidth>
          Add Department
        </Button>
      </form>
    </Card>
  );
}
