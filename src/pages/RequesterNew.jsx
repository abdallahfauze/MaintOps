import { useState, useEffect } from "react";
import { Store, MaintenanceTask, Users } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/shared/MobileSelect";
import CategoryGrid from "@/components/requester/CategoryGrid";
import SubCategoryGrid, { coolingIssues } from "@/components/requester/SubCategoryGrid";
import SubLocationGrid from "@/components/requester/SubLocationGrid";
import { Camera, ChevronLeft, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { notifyTaskEvent } from "@/lib/notifications";
import { uploadTaskPhoto } from "@/lib/storage";

export default function RequesterNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [coolingIssue, setCoolingIssue] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [storeId, setStoreId] = useState("");
  const [subLocation, setSubLocation] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const role = user?.role;
  const isUnrestricted = role === "admin" || role === "leadership" || role === "coordinator";
  const myStoreIds = user?.store_ids?.length
    ? user.store_ids
    : user?.store_id
    ? [user.store_id]
    : [];

  const { data: allStores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => Store.list("store_code"),
  });

  const stores = isUnrestricted ? allStores : allStores.filter(s => myStoreIds.includes(s.id));

  useEffect(() => {
    if (!isUnrestricted && myStoreIds.length === 1 && allStores.length > 0 && !storeId) {
      setStoreId(myStoreIds[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStores.length]);

  const { data: adminUsers = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => Users.filter({ role: "admin" }),
  });

  const { data: coordinatorUsers = [] } = useQuery({
    queryKey: ["coordinator-users"],
    queryFn: () => Users.filter({ role: "coordinator" }),
  });

  const createTask = useMutation({
    mutationFn: (data) => MaintenanceTask.create(data),
    onSuccess: async (createdTask, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requester-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      const store = stores.find(s => s.id === variables.store_id);
      const notifTitle = `New Request: ${variables.task_code} · ${variables.title}`;
      const notifBody = `Store: ${variables.store_code} · ${variables.store_name}\nLocation: ${variables.sub_location}\nCategory: ${variables.category}/${variables.sub_category}\nPriority: ${variables.priority?.toUpperCase()}`;

      const emailRecipients = [];
      const userRecipients = [];

      if (store?.maintenance_team_email) emailRecipients.push(store.maintenance_team_email);
      adminUsers.forEach(u => {
        if (u.email) {
          emailRecipients.push(u.email);
          userRecipients.push({ email: u.email, role: u.role });
        }
      });
      coordinatorUsers.forEach(u => {
        if (u.email) {
          emailRecipients.push(u.email);
          userRecipients.push({ email: u.email, role: u.role });
        }
      });
      if (user?.email) {
        emailRecipients.push(user.email);
        userRecipients.push({ email: user.email, role: user.role });
      }

      notifyTaskEvent({
        type: "task_created",
        title: notifTitle,
        body: notifBody,
        task: createdTask,
        emails: emailRecipients,
        users: userRecipients,
      });

      toast({ title: "Request submitted", description: "Your maintenance request has been logged." });
      navigate("/dashboard", { replace: true });
    },
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadTaskPhoto));
      setPhotos(prev => [...prev, ...urls]);
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    const store = stores.find(s => s.id === storeId);
    if (!title || !category || !subCategory || !storeId || !subLocation) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    const taskCode = `MT-${format(new Date(), "yyyyMMdd")}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;
    setSubmitting(true);
    createTask.mutate({
      task_code: taskCode,
      title,
      description,
      category,
      sub_category: subCategory,
      cooling_issue: category === "cooling" ? coolingIssue : undefined,
      sub_location: subLocation,
      priority,
      status: "assigned",
      store_id: storeId,
      store_code: store?.store_code || "",
      store_name: store?.name || "",
      assigned_team_name: store?.maintenance_team || "",
      assigned_date: store?.maintenance_team ? new Date().toISOString() : undefined,
      photo_urls: photos,
    }, { onSettled: () => setSubmitting(false) });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> BACK TO REQUESTS
        </button>
        <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-1">
          STORE PORTAL · REQUESTER
        </div>
        <h1 className="font-display font-black text-3xl tracking-tight">RAISE REQUEST</h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className="font-mono text-xs text-muted-foreground block mb-2">SELECT STORE *</label>
          <MobileSelect
            value={storeId}
            onValueChange={(val) => { setStoreId(val); setSubLocation(""); setCategory(""); setSubCategory(""); setCoolingIssue(""); }}
            placeholder="Choose your store"
            title="Select Store"
            options={stores.map(s => ({ value: s.id, label: `${s.store_code} · ${s.name}` }))}
            triggerClassName="w-full"
          />
        </div>

        {storeId && (
          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-2">STORE AREA / LOCATION *</label>
            <SubLocationGrid
              selected={subLocation}
              onSelect={setSubLocation}
              storeCode={stores.find(s => s.id === storeId)?.store_code}
            />
          </div>
        )}

        {subLocation && (
          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-2">ISSUE CATEGORY *</label>
            <CategoryGrid selected={category} onSelect={(val) => { setCategory(val); setSubCategory(""); setCoolingIssue(""); }} />
          </div>
        )}

        {category && subLocation && (
          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-2">SUB-CATEGORY *</label>
            <SubCategoryGrid category={category} selected={subCategory} onSelect={setSubCategory} />
          </div>
        )}

        {category === "cooling" && subCategory && (
          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-2">ISSUE TYPE *</label>
            <div className="flex flex-wrap gap-0">
              {coolingIssues.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCoolingIssue(value)}
                  className={`border-2 px-4 py-2.5 font-mono text-xs tracking-wider transition-all ${
                    coolingIssue === value
                      ? "border-amber bg-amber/10 text-foreground"
                      : "border-border hover:border-foreground text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="font-mono text-xs text-muted-foreground block mb-2">ISSUE TITLE *</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="border-2 font-display text-lg font-bold"
            placeholder="Brief description of the issue"
          />
        </div>

        <div>
          <label className="font-mono text-xs text-muted-foreground block mb-2">DETAILS</label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="border-2 min-h-[120px]"
            placeholder="Describe the issue in detail..."
          />
        </div>

        <div>
          <label className="font-mono text-xs text-muted-foreground block mb-2">PRIORITY</label>
          <div className="flex gap-0">
            {["low", "medium", "high", "critical"].map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 border-2 py-3 font-mono text-xs tracking-wider transition-colors ${
                  priority === p
                    ? p === "critical" ? "border-destructive bg-destructive/10 text-destructive"
                    : p === "high" ? "border-amber bg-amber/10 text-amber"
                    : "border-foreground bg-foreground/5"
                    : "border-border hover:border-foreground"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-xs text-muted-foreground block mb-2">PHOTOS</label>
          <div className="flex gap-3 flex-wrap">
            {photos.map((url, i) => (
              <img key={i} src={url} alt="Issue" className="w-24 h-24 object-cover border-2 border-border" />
            ))}
            <label className="w-24 h-24 border-2 border-dashed border-border hover:border-foreground flex flex-col items-center justify-center cursor-pointer transition-colors">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-muted-foreground border-t-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-muted-foreground" />
                  <span className="font-mono text-xs text-muted-foreground mt-1">UPLOAD</span>
                </>
              )}
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || !title || !category || !subCategory || !storeId || !subLocation}
          className="w-full bg-foreground text-background hover:bg-foreground/90 font-display font-bold tracking-wider py-6 text-base"
        >
          {submitting ? "SUBMITTING..." : "SUBMIT REQUEST"}
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
