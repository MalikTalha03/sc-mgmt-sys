import { useState } from "react";
import { FormInput } from "./formInput";
import { Button } from "./button";
import { Card, CardHeader } from "./card";
import { Dropdown } from "./dropdown";
import type { Department } from "../models/department";
import { UserPlus } from "lucide-react";

interface TeacherFormProps {
    onSubmit?: (data: any) => void;
    departments?: Department[];
}

export function TeacherForm({ onSubmit, departments = [] }: TeacherFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        departmentCode: "",
        designation: "Lecturer"
    });

    const designationOptions = [
        { value: "Visiting Faculty", label: "Visiting Faculty" },
        { value: "Lecturer", label: "Lecturer" },
        { value: "Assistant Professor", label: "Assistant Professor" },
        { value: "Associate Professor", label: "Associate Professor" },
        { value: "Professor", label: "Professor" },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(formData);
        setFormData({
            name: "",
            email: "",
            departmentCode: "",
            designation: "Lecturer"
        });
    };

    return (
        <Card>
            <CardHeader>Add New Teacher</CardHeader>
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                <FormInput
                    label="Full Name"
                    type="text"
                    placeholder="Enter teacher's full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />

                <FormInput
                    label="Email Address"
                    type="email"
                    placeholder="teacher@university.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />

                <Dropdown
                    label="Department"
                    options={departments.map(d => ({ value: d.code, label: `${d.name} (${d.code})` }))}
                    value={formData.departmentCode}
                    onChange={(value) => setFormData({ ...formData, departmentCode: value })}
                    placeholder="Select department"
                />
                
                <Dropdown
                    label="Designation"
                    options={designationOptions}
                    value={formData.designation}
                    onChange={(value) => setFormData({ ...formData, designation: value })}
                    placeholder="Select designation"
                />

                <div style={{ marginTop: '8px' }}>
                    <Button type="submit" fullWidth>
                        <UserPlus size={18} />
                        Add Teacher
                    </Button>
                </div>
            </form>
        </Card>
    );
}