import { useState } from "react";
import { Card, CardHeader } from "./card";
import { Button } from "./button";
import { FormInput } from "./formInput";
import { Building2 } from "lucide-react";

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
      <CardHeader>Add New Department</CardHeader>
      <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
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

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '20px'
        }}>
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            style={{ 
              width: '18px', 
              height: '18px',
              accentColor: '#4f46e5',
              cursor: 'pointer'
            }}
          />
          <label 
            htmlFor="isActive" 
            style={{ 
              fontSize: '14px', 
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            Active Department
          </label>
        </div>

        <Button type="submit" fullWidth>
          <Building2 size={18} />
          Add Department
        </Button>
      </form>
    </Card>
  );
}
