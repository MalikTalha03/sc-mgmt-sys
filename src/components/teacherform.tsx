import React from "react";
import { FormInput } from "./formInput";
import { Button } from "./button";
import { Card, CardHeader } from "./card";
import { Dropdown } from "./dropdown";
import type { Department } from "../models/department";

interface TeacherFormProps {
    onSubmit?: (data: any) => void;
    departments?: Department[];
}

export function TeacherForm({ onSubmit, departments = [] }: TeacherFormProps) {
    const [formData, setFormData] = React.useState({
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
        // Reset form
        setFormData({
            name: "",
            email: "",
            departmentCode: "",
            designation: "Lecturer"
        });
    };

    return (
        <Card>
            <CardHeader className="p-2">Add New Teacher</CardHeader>
            <form className="space-y-5 p-6 grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department Code
                    </label>
                    <Dropdown
                        options={departments.map(d => ({ value: d.code, label: `${d.name} (${d.code})` }))}
                        value={formData.departmentCode}
                        onChange={(value) => setFormData({ ...formData, departmentCode: value })}
                        placeholder="Select department"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designation
                    </label>
                    <Dropdown
                        options={designationOptions}
                        value={formData.designation}
                        onChange={(value) => setFormData({ ...formData, designation: value })}
                        placeholder="Select designation"
                    />
                </div>

                <Button type="submit" fullWidth>
                    Add Teacher
                </Button>
            </form>
        </Card>
    );
}