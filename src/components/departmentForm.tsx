import { useState } from "react";
import { Card, CardHeader } from "./card";
import { Button } from "./button";
import { Building2 } from "lucide-react";

interface DepartmentFormProps {
  onSubmit: (data: {
    code: string;
    name: string;
  }) => void;
}

export function DepartmentForm({ onSubmit }: DepartmentFormProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ code: "", name: "" });
  };

  return (
    <Card>
      <CardHeader>Add New Department</CardHeader>
      <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
            Department Code
          </label>
          <input
            type="text"
            placeholder="e.g., CS, EE, ME"
            value={formData.code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
            Department Name
          </label>
          <input
            type="text"
            placeholder="e.g., Computer Science"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <Button type="submit" fullWidth>
          <Building2 size={18} />
          Add Department
        </Button>
      </form>
    </Card>
  );
}
