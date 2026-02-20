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
      <form onSubmit={handleSubmit} className="p-24">
        <div className="form-input-wrapper">
          <label className="form-input-label">
            Department Code
          </label>
          <input
            type="text"
            placeholder="e.g., CS, EE, ME"
            value={formData.code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value })}
            required
            className="form-input-field"
          />
        </div>

        <div className="form-input-wrapper">
          <label className="form-input-label">
            Department Name
          </label>
          <input
            type="text"
            placeholder="e.g., Computer Science"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            required
            className="form-input-field"
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
