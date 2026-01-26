import React from "react";
import { FormInput } from "./formInput";
import { Button } from "./button";
import { Card, CardHeader } from "./card";
import { Dropdown } from "./dropdown";
import type { Department } from "../models/department";

interface CourseFormProps {
    onSubmit?: (data: any) => void;
    departments?: Department[];
}

export function CourseForm({ onSubmit, departments = [] }: CourseFormProps) {
    const [formData, setFormData] = React.useState({
        title: "",
        code: "",
        creditHours: "3",
        departmentCode: "",
        semester: "1"
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(formData);
        // Reset form
        setFormData({
            title: "",
            code: "",
            creditHours: "3",
            departmentCode: "",
            semester: "1"
        });
    };

    return (
        <Card>
            <CardHeader className="p-2">Add New Course</CardHeader>
            <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 p-6 gap-4">
                    <FormInput
                        label="Course Title"
                        type="text"
                        placeholder="e.g., Data Structures and Algorithms"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <FormInput
                        label="Course Code"
                        type="text"
                        placeholder="e.g., CS101"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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

                    <FormInput
                        label="Credit Hours"
                        type="number"
                        min={1}
                        max={6}
                        value={formData.creditHours}
                        onChange={(e) => setFormData({ ...formData, creditHours: e.target.value })}
                        helperText="1-6 credit hours"
                        required
                    />

                    <FormInput
                        label="Semester"
                        type="number"
                        min={1}
                        max={8}
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        helperText="Semester 1-8"
                        required
                    />
                </div>

<div className="p-6 grid grid-cols-2">
    <Button type="submit" className="w-full">
        Add Course
    </Button>
</div>

            </form>
        </Card>
    );
}