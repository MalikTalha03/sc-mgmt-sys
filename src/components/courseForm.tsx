import { useState } from "react";
import { FormInput } from "./formInput";
import { Button } from "./button";
import { Card, CardHeader } from "./card";
import { Dropdown } from "./dropdown";
import type { Department } from "../models/department";
import { BookPlus } from "lucide-react";

interface CourseFormProps {
    onSubmit?: (data: any) => void;
    departments?: Department[];
}

export function CourseForm({ onSubmit, departments = [] }: CourseFormProps) {
    const [formData, setFormData] = useState({
        title: "",
        code: "",
        creditHours: "3",
        departmentCode: "",
        semester: "1"
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(formData);
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
            <CardHeader>Add New Course</CardHeader>
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
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

                <Dropdown
                    label="Department"
                    options={departments.map(d => ({ value: d.code, label: `${d.name} (${d.code})` }))}
                    value={formData.departmentCode}
                    onChange={(value) => setFormData({ ...formData, departmentCode: value })}
                    placeholder="Select department"
                />

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

                <div style={{ marginTop: '8px' }}>
                    <Button type="submit" fullWidth>
                        <BookPlus size={18} />
                        Add Course
                    </Button>
                </div>
            </form>
        </Card>
    );
}